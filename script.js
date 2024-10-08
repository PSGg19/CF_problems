document.getElementById('fetchButton').addEventListener('click', fetchProblems);
document.getElementById('userId').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        fetchProblems();
    }
});

let solvedProblemRatings = {};
let struggledProblemRatings = {};
let solvedChart = null;
let struggledChart = null;

async function fetchProblems() {
    const userId = document.getElementById('userId').value.trim();
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    const mainContent = document.getElementById('mainContent');

    if (!userId) {
        alert('Please enter a Codeforces ID.');
        return;
    }

    loading.classList.remove('hidden');
    error.classList.add('hidden');
    mainContent.classList.add('hidden');
    document.getElementById('solvedDetails').classList.add('hidden');
    document.getElementById('struggledDetails').classList.add('hidden');

    try {
        const submissionsResponse = await fetch(`https://codeforces.com/api/user.status?handle=${userId}&from=1&count=10000`);
        const submissionsData = await submissionsResponse.json();

        if (submissionsData.status !== 'OK') {
            throw new Error('Error fetching submissions');
        }

        const submissions = submissionsData.result;
        solvedProblemRatings = {};
        struggledProblemRatings = {};
        const solvedSet = new Set();
        const struggledSet = new Set();

        for (const submission of submissions) {
            const { name, contestId, index, rating } = submission.problem;
            const problemLink = `https://codeforces.com/problemset/problem/${contestId}/${index}`;
            const uniqueProblemIdentifier = `${contestId}-${index}`;

            if (submission.verdict === 'OK') {
                if (!solvedSet.has(uniqueProblemIdentifier)) {
                    solvedSet.add(uniqueProblemIdentifier);
                    if (!solvedProblemRatings[rating]) {
                        solvedProblemRatings[rating] = [];
                    }
                    solvedProblemRatings[rating].push({ name, link: problemLink });
                }
            } else if (submission.verdict === 'WRONG_ANSWER' || submission.verdict === 'PRESENTATION_ERROR') {
                if (!struggledSet.has(uniqueProblemIdentifier)) {
                    struggledSet.add(uniqueProblemIdentifier);
                    if (!struggledProblemRatings[rating]) {
                        struggledProblemRatings[rating] = [];
                    }
                    struggledProblemRatings[rating].push({ name, link: problemLink });
                }
            }
        }

        createChart('solvedChart', solvedProblemRatings, 'All Solved Problems');
        createChart('struggledChart', struggledProblemRatings, 'Struggled Problems');
        setupUniformScroll();

        mainContent.classList.remove('hidden');

    } catch (err) {
        error.innerText = `Error: ${err.message}`;
        error.classList.remove('hidden');
    } finally {
        loading.classList.add('hidden');
    }
}

function createChart(canvasId, problemRatings, title) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    if (canvasId === 'solvedChart' && solvedChart) {
        solvedChart.destroy();
    } else if (canvasId === 'struggledChart' && struggledChart) {
        struggledChart.destroy();
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

    const chartColors = chartLabels.map(rating => getColorForRating(parseInt(rating)));

    const newChart = new Chart(ctx, {
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
            responsive: true,
            maintainAspectRatio: false,
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
                title: {
                    display: true,
                    text: title
                },
                tooltip: {
                    callbacks: {
                        label: (context) => `Number of Problems: ${context.raw}`
                    }
                }
            },
            onClick: (event, elements) => {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    const rating = chartLabels[index];
                    displayProblems(rating, canvasId === 'solvedChart' ? solvedProblemRatings : struggledProblemRatings, canvasId === 'solvedChart' ? 'solvedDetails' : 'struggledDetails');
                }
            }
        }
    });

    if (canvasId === 'solvedChart') {
        solvedChart = newChart;
    } else if (canvasId === 'struggledChart') {
        struggledChart = newChart;
    }
}

function displayProblems(rating, problemRatings, detailsId) {
    const problemList = problemRatings[rating] || [];
    const detailsContent = document.getElementById(detailsId);
    const otherDetailsId = detailsId === 'solvedDetails' ? 'struggledDetails' : 'solvedDetails';
    const otherDetailsContent = document.getElementById(otherDetailsId);

    if (problemList.length === 0) {
        detailsContent.innerHTML = `<h4>Problems with Rating ${rating}</h4>No problems with rating ${rating} found.`;
    } else {
        detailsContent.innerHTML = `<h4>Problems with Rating ${rating}</h4>`;
        
        problemList.forEach((problem, index) => {
            const problemElement = document.createElement('div');
            problemElement.className = 'problem';
            problemElement.innerHTML = `<a href="${problem.link}" target="_blank" class="problem-title">${index+1}. ${problem.name}</a>`;
            detailsContent.appendChild(problemElement);
        });
    }

    detailsContent.classList.remove('hidden');
    otherDetailsContent.classList.remove('hidden');

    detailsContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function setupUniformScroll() {
    const solvedDetails = document.getElementById('solvedDetails');
    const struggledDetails = document.getElementById('struggledDetails');

    solvedDetails.addEventListener('scroll', () => {
        struggledDetails.scrollTop = solvedDetails.scrollTop;
    });

    struggledDetails.addEventListener('scroll', () => {
        solvedDetails.scrollTop = struggledDetails.scrollTop;
    });
}