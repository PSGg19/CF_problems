// Event listener: Fetch problems when button is clicked
document.getElementById('fetchButton').addEventListener('click', fetchProblems);

// Event listener: Fetch problems when Enter key is pressed in input
document.getElementById('userId').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        fetchProblems();
    }
});

// Global variables to store problem ratings and chart instances
let solvedProblemRatings = {};
let struggledProblemRatings = {};
let solvedChart = null;
let struggledChart = null;

// Function to fetch user submissions and categorize problems
async function fetchProblems() {
    const userId = document.getElementById('userId').value.trim();
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    const mainContent = document.getElementById('mainContent');

    // If no userId is entered, show alert
    if (!userId) {
        alert('Please enter a Codeforces ID.');
        return;
    }

    // Show loading animation, hide previous results
    loading.classList.remove('hidden');
    error.classList.add('hidden');
    mainContent.classList.add('hidden');
    document.getElementById('solvedDetails').classList.add('hidden');
    document.getElementById('struggledDetails').classList.add('hidden');

    try {
        // Fetch all submissions from Codeforces API
        const submissionsResponse = await fetch(`https://codeforces.com/api/user.status?handle=${userId}&from=1&count=10000`);
        const submissionsData = await submissionsResponse.json();

        // Handle API error
        if (submissionsData.status !== 'OK') {
            throw new Error('Error fetching submissions');
        }

        const submissions = submissionsData.result;
        solvedProblemRatings = {};
        struggledProblemRatings = {};
        const solvedSet = new Set();
        const struggledSet = new Set();

        // Loop through each submission and categorize into solved/struggled
        for (const submission of submissions) {
            const { name, contestId, index, rating } = submission.problem;
            const problemLink = `https://codeforces.com/problemset/problem/${contestId}/${index}`;
            const uniqueProblemIdentifier = `${contestId}-${index}`;

            if (submission.verdict === 'OK') {
                // Solved problems
                if (!solvedSet.has(uniqueProblemIdentifier)) {
                    solvedSet.add(uniqueProblemIdentifier);
                    if (!solvedProblemRatings[rating]) {
                        solvedProblemRatings[rating] = [];
                    }
                    solvedProblemRatings[rating].push({ name, link: problemLink });
                }
            } else if (submission.verdict === 'WRONG_ANSWER' || submission.verdict === 'PRESENTATION_ERROR') {
                // Struggled problems (wrong answer or presentation error)
                if (!struggledSet.has(uniqueProblemIdentifier)) {
                    struggledSet.add(uniqueProblemIdentifier);
                    if (!struggledProblemRatings[rating]) {
                        struggledProblemRatings[rating] = [];
                    }
                    struggledProblemRatings[rating].push({ name, link: problemLink });
                }
            }
        }

        // Create charts for solved and struggled problems
        createChart('solvedChart', solvedProblemRatings, 'All Solved Problems');
        createChart('struggledChart', struggledProblemRatings, 'Struggled Problems');

        // Enable uniform scroll between both problem lists
        setupUniformScroll();

        // Show main content after loading
        mainContent.classList.remove('hidden');

    } catch (err) {
        // Show error message on fetch failure
        error.innerText = `Error: ${err.message}`;
        error.classList.remove('hidden');
    } finally {
        // Hide loading animation
        loading.classList.add('hidden');
    }
}

// Function to create and render a bar chart
function createChart(canvasId, problemRatings, title) {
    const ctx = document.getElementById(canvasId).getContext('2d');

    // Destroy existing chart if it exists (to avoid overlapping)
    if (canvasId === 'solvedChart' && solvedChart) {
        solvedChart.destroy();
    } else if (canvasId === 'struggledChart' && struggledChart) {
        struggledChart.destroy();
    }

    // Ratings we want to display on the X-axis
    const chartLabels = ['800', '900', '1000', '1100', '1200', '1300', '1400', '1500', '1600', '1700', '1800', '1900', '2000', '2100', '2200', '2300', '2400', '2500', '2600'];

    // Data for each rating: number of problems solved/struggled
    const chartData = chartLabels.map(rating => problemRatings[rating] ? problemRatings[rating].length : 0);

    // Function to return color based on rating range
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

    // Colors for each bar based on rating
    const chartColors = chartLabels.map(rating => getColorForRating(parseInt(rating)));

    // Create a new bar chart using Chart.js
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
            // Handle click on a bar -> show problems of that rating
            onClick: (event, elements) => {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    const rating = chartLabels[index];
                    displayProblems(
                        rating, 
                        canvasId === 'solvedChart' ? solvedProblemRatings : struggledProblemRatings, 
                        canvasId === 'solvedChart' ? 'solvedDetails' : 'struggledDetails'
                    );
                }
            }
        }
    });

    // Save the chart instance for later destruction
    if (canvasId === 'solvedChart') {
        solvedChart = newChart;
    } else if (canvasId === 'struggledChart') {
        struggledChart = newChart;
    }
}

// Function to display problems of a specific rating inside a given container
function displayProblems(rating, problemRatings, detailsId) {
    const problemList = problemRatings[rating] || [];

    // Get the container where problems will be shown
    const detailsContent = document.getElementById(detailsId);

    // Also get the opposite container to show side by side
    const otherDetailsId = detailsId === 'solvedDetails' ? 'struggledDetails' : 'solvedDetails';
    const otherDetailsContent = document.getElementById(otherDetailsId);

    // If no problems exist for that rating
    if (problemList.length === 0) {
        detailsContent.innerHTML = `<h4>Problems with Rating ${rating}</h4>No problems with rating ${rating} found.`;
    } 
    // If problems exist
    else {
        detailsContent.innerHTML = `<h4>Problems with Rating ${rating}</h4>`;

        // Create a link for each problem
        problemList.forEach((problem, index) => {
            const problemElement = document.createElement('div');
            problemElement.className = 'problem';
            problemElement.innerHTML = `<a href="${problem.link}" target="_blank" class="problem-title">${index + 1}. ${problem.name}</a>`;
            detailsContent.appendChild(problemElement);
        });
    }

    // Make both containers visible
    detailsContent.classList.remove('hidden');
    otherDetailsContent.classList.remove('hidden');

    // Scroll smoothly to the selected container
    detailsContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Function to sync scroll between Solved and Struggled problem lists
function setupUniformScroll() {
    const solvedDetails = document.getElementById('solvedDetails');
    const struggledDetails = document.getElementById('struggledDetails');

    // When scrolling one list, scroll the other one automatically
    solvedDetails.addEventListener('scroll', () => {
        struggledDetails.scrollTop = solvedDetails.scrollTop;
    });

    struggledDetails.addEventListener('scroll', () => {
        solvedDetails.scrollTop = struggledDetails.scrollTop;
    });
}
