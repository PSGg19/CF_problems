document.getElementById('fetchButton').addEventListener('click', fetchProblems);

let problemRatings = {};
let ratingChart = null;  // Declare the chart variable globally

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
        const submissionsResponse = await fetch(`https://codeforces.com/api/user.status?handle=${userId}&from=1&count=10000`);
        const submissionsData = await submissionsResponse.json();

        if (submissionsData.status !== 'OK') {
            throw new Error('Error fetching submissions');
        }

        const submissions = submissionsData.result;
        problemRatings = {};
        const problemSet = new Set();

        for (const submission of submissions) {
            if (submission.verdict === 'WRONG_ANSWER' || submission.verdict!=='OK' || submission.verdict === 'PRESENTATION_ERROR') {
                const { name, contestId, index, rating } = submission.problem;
                const problemLink = `https://codeforces.com/problemset/problem/${contestId}/${index}`;

                const uniqueProblemIdentifier = `${contestId}-${index}`;

                if (!problemSet.has(uniqueProblemIdentifier)) {
                    problemSet.add(uniqueProblemIdentifier);

                    if (!problemRatings[rating]) {
                        problemRatings[rating] = [];
                    }

                    problemRatings[rating].push({ name, link: problemLink });
                }
            }
        }

        if (Object.keys(problemRatings).length === 0) {
            document.getElementById('results').innerHTML = 'No problems with unsuccessful submissions found.';
            return;
        }

        // Destroy the existing chart before creating a new one
        if (ratingChart) {
            ratingChart.destroy();
        }

        const chartLabels = ['800', '900', '1000', '1100', '1200', '1300', '1400', '1500', '1600', '1700', '1800', '1900', '2000', '2100', '2200', '2300', '2400', '2500', '2600'];
        const chartData = chartLabels.map(rating => problemRatings[rating] ? problemRatings[rating].length : 0);

        const getColorForRating = (rating) => {
            if (rating >= 0 && rating <= 1100) return 'rgba(0, 0, 0, 0.3)';
            if (rating >= 1200 && rating <= 1300) return 'rgba(0, 128, 0, 0.5)';
            if (rating >= 1400 && rating <= 1500) return 'rgba(0, 255, 255, 0.5)';
            if (rating >= 1600 && rating <= 1800) return 'rgba(0, 0, 255, 0.5)';
            if (rating >= 1900 && rating <= 2100) return 'rgba(128, 0, 128, 0.5)';
            if (rating >= 2200 && rating <= 2300) return 'rgba(255, 165, 0, 0.5)';
            if (rating >= 2400 && rating <= 2600) return 'rgba(255, 0, 0, 0.5)';
            return 'rgba(128, 128, 128, 0.5)';
        };

        const chartColors = chartLabels.map(rating => getColorForRating(rating));

        // Create the new chart
        ratingChart = new Chart(document.getElementById('ratingChart'), {
            type: 'bar',
            data: {
                labels: chartLabels,
                datasets: [{
                    label: 'Number of Problems',
                    data: chartData,
                    backgroundColor: chartColors,
                    borderColor: chartColors,
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Rating'
                        },
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Number of Problems'
                        },
                        beginAtZero: true,
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => `${context.dataset.label}: ${context.raw}`
                        }
                    }
                },
                onClick: (event, elements) => {
                    if (elements.length > 0) {
                        const index = elements[0].index;
                        const rating = chartLabels[index];
                        displayProblems(rating);

                        document.getElementById('details').scrollIntoView({
                            behavior: 'smooth'
                        });
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
    
    problemList.forEach((problem,index) => {

        const problemElement = document.createElement('div');
        problemElement.className = 'problem';
        problemElement.innerHTML = `<a href="${problem.link}" target="_blank" class="problem-title">${index+1}. ${ problem.name}</a>`;
        detailsContent.appendChild(problemElement);

    });

    document.getElementById('details').classList.remove('hidden');
}