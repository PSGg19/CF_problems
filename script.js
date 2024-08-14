document.getElementById('fetchButton').addEventListener('click', fetchProblems);

async function fetchProblems() {
    const userId = document.getElementById('userId').value.trim();
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    const results = document.getElementById('results');

    if (!userId) {
        alert('Please enter a Codeforces ID.');
        return;
    }

    loading.classList.remove('hidden');
    error.classList.add('hidden');
    results.innerHTML = '';

    try {
        // Fetch user submissions
        const submissionsResponse = await fetch(`https://codeforces.com/api/user.status?handle=${userId}&from=1&count=10000`);
        const submissionsData = await submissionsResponse.json();

        if (submissionsData.status !== 'OK') {
            throw new Error('Error fetching submissions');
        }

        const submissions = submissionsData.result;
        const problemSet = new Set();

        // Process submissions to find problems with unsuccessful submissions
        for (const submission of submissions) {
            if (submission.verdict === 'WRONG_ANSWER' || submission.verdict === 'PRESENTATION_ERROR') {
                problemSet.add(submission.problem.name);
            }
        }

        if (problemSet.size === 0) {
            results.innerHTML = 'No problems with unsuccessful submissions found.';
            return;
        }

        // Fetch problem details
        const problems = [];
        const problemDetailsResponse = await fetch('https://codeforces.com/api/problemset.problems');
        const problemDetailsData = await problemDetailsResponse.json();

        if (problemDetailsData.status !== 'OK') {
            throw new Error('Error fetching problem details');
        }

        const allProblems = problemDetailsData.result.problems;

        problemSet.forEach(problemName => {
            const problem = allProblems.find(p => p.name === problemName);
            if (problem) {
                problems.push({
                    name: problem.name,
                    rating: problem.rating || 'Unknown'
                });
            }
        });

        problems.sort((a, b) => a.rating - b.rating);

        if (problems.length === 0) {
            results.innerHTML = 'No problems with unsuccessful submissions found.';
            return;
        }

        problems.forEach(problem => {
            const problemElement = document.createElement('div');
            problemElement.className = 'problem';
            problemElement.innerHTML = `<div class="problem-title">${problem.name}</div><div class="problem-rating">Rating: ${problem.rating}</div>`;
            results.appendChild(problemElement);
        });
    } catch (err) {
        error.innerText = `Error: ${err.message}`;
    } finally {
        loading.classList.add('hidden');
    }
}
