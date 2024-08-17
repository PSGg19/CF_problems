

document.getElementById('fetchButton').addEventListener('click', fetchProblems);

let problemRatings = {};  // Declare as global to be accessible in displayProblems function

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
        problemRatings = {};
        const problemSet = new Set();  // To track unique problems

        // Process submissions to find problems with unsuccessful submissions
        for (const submission of submissions) {
            if (submission.verdict === 'WRONG_ANSWER' || submission.verdict === 'PRESENTATION_ERROR') {
                const { name, contestId, index, rating } = submission.problem;
                const problemLink = `https://codeforces.com/problemset/problem/${contestId}/${index}`;

                // Use a unique identifier for each problem, like the problem's link or a combination of contestId and index
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

        // Prepare data for the bar chart
        const chartLabels = Object.keys(problemRatings).sort((a, b) => a - b);
        const chartData = chartLabels.map(rating => problemRatings[rating].length);

        // Define colors based on rating ranges
        const getColorForRating = (rating) => {
            if (rating >= 0 && rating <= 1100) return 'rgba(0, 0, 0, 0.3)';   // Black with 30% opacity for 0-1100
            if (rating >= 1200 && rating <= 1300) return 'rgba(0, 128, 0, 0.5)'; // Green with 50% opacity
            if (rating >= 1400 && rating <= 1500) return 'rgba(0, 255, 255, 0.5)'; // Cyan with 50% opacity
            if (rating >= 1600 && rating <= 1800) return 'rgba(0, 0, 255, 0.5)'; // Blue with 50% opacity
            if (rating >= 1900 && rating <= 2100) return 'rgba(128, 0, 128, 0.5)'; // Violet with 50% opacity
            if (rating >= 2200 && rating <= 2300) return 'rgba(255, 165, 0, 0.5)'; // Orange with 50% opacity
            if (rating >= 2400 && rating <= 2600) return 'rgba(255, 0, 0, 0.5)'; // Red with 50% opacity
            return 'rgba(128, 128, 128, 0.5)'; // Gray with 50% opacity for other ratings
        };

        const chartColors = chartLabels.map(rating => getColorForRating(rating));

        // Create the bar chart
        new Chart(document.getElementById('ratingChart'), {
            type: 'bar',
            data: {
                labels: chartLabels,
                datasets: [{
                    label: 'Number of Problems',
                    data: chartData,
                    backgroundColor: chartColors, // Colors with transparency
                    borderColor: chartColors, // Same as background color
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
                        },
                        beginAtZero: true
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
