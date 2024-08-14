document.getElementById('fetchButton').addEventListener('click', fetchProblems);

async function fetchProblems() {
    const userId = document.getElementById('userId').value.trim();
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    const details = document.getElementById('details');
    const detailsContent = document.getElementById('detailsContent');

    if (!userId) {
        alert('Please enter a Codeforces ID.');
        return;
    }

    loading.classList.remove('hidden');
    error.classList.add('hidden');
    details.classList.add('hidden');
    detailsContent.innerHTML = '';

    try {
        // Fetch user submissions
        const submissionsResponse = await fetch(`https://codeforces.com/api/user.status?handle=${userId}&from=1&count=10000`);
        const submissionsData = await submissionsResponse.json();

        if (submissionsData.status !== 'OK') {
            throw new Error('Error fetching submissions');
        }

        const submissions = submissionsData.result;
        const problemSet = new Set();
        const problemRatings = {};

        // Process submissions to find problems with unsuccessful submissions
        for (const submission of submissions) {
            if (submission.verdict === 'WRONG_ANSWER' || submission.verdict === 'PRESENTATION_ERROR') {
                const { name, contestId, index, rating } = submission.problem;
                const problemLink = `https://codeforces.com/problemset/problem/${contestId}/${index}`;

                if (!problemRatings[rating]) {
                    problemRatings[rating] = [];
                }
                problemRatings[rating].push({ name, link: problemLink });
                problemSet.add(name);
            }
        }

        if (Object.keys(problemRatings).length === 0) {
            document.getElementById('results').innerHTML = 'No problems with unsuccessful submissions found.';
            return;
        }

        // Prepare data for the bar chart
        const chartLabels = Object.keys(problemRatings).sort((a, b) => a - b);
        const chartData = chartLabels.map(rating => problemRatings[rating].length);

        // Create the bar chart
        new Chart(document.getElementById('ratingChart'), {
            type: 'bar',
            data: {
                labels: chartLabels,
                datasets: [{
                    label: 'Number of Problems',
                    data: chartData,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Rating'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Number of Problems'
                        }
                    }
                },
                onClick: (event, elements) => {
                    if (elements.length > 0) {
                        const index = elements[0].index;
                        const rating = chartLabels[index];
                        displayProblems(rating);
                    }
                }
            }
        });
    } catch (err) {
        error.innerText = `Error: ${err.message}`;
    } finally {
        loading.classList.add('hidden');
    }
}

function displayProblems(rating) {
    const problemList = problemRatings[rating] || [];
    const detailsContent = document.getElementById('detailsContent');

    if (problemList.length === 0) {
        detailsContent.innerHTML = `No problems with rating ${rating} found.`;
        return;
    }

    detailsContent.innerHTML = `<h3>Problems with Rating ${rating}</h3>`;
    problemList.forEach(problem => {
        const problemElement = document.createElement('div');
        problemElement.className = 'problem';
        problemElement.innerHTML = `<a href="${problem.link}" target="_blank" class="problem-title">${problem.name}</a>`;
        detailsContent.appendChild(problemElement);
    });

    document.getElementById('details').classList.remove('hidden');
}
