document.getElementById('studentForm').addEventListener('submit', function(e) {
    e.preventDefault();
    let location = document.getElementById('location').value;
    let studyLevel = document.getElementById('studyLevel').value;
    let courseInterest = document.getElementById('courseInterest').value;
    let additionalInterests = document.getElementById('additionalInterests').value;
    let budget = document.getElementById('budget').value;

    // This is a placeholder for the function that fetches and processes data.
    findCourses(location, studyLevel, courseInterest, additionalInterests, budget);
});

function findCourses(location, studyLevel, courseInterest, additionalInterests, budget) {
    // Use Fetch API or other methods to get data from the provided URLs.
    // This is a simplified example; you would typically need to use server-side code to avoid CORS issues.
    
    let resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '<p>Searching for courses...</p>';

    // Example of a fetch request (this will need to be adapted to the specific APIs and data format)
    fetch('https://api.example.com/search?location=' + location + '&studyLevel=' + studyLevel + '&courseInterest=' + courseInterest + '&budget=' + budget)
        .then(response => response.json())
        .then(data => {
            // Process the data and display the results
            displayResults(data);
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            resultsDiv.innerHTML = '<p>Error fetching data. Please try again later.</p>';
        });
}

function displayResults(data) {
    let resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '<h2>Top 10 Courses:</h2>';
    
    let topCourses = data.topCourses; // Adjust this to match your data structure
    topCourses.forEach(course => {
        resultsDiv.innerHTML += `<p>${course.name} - ${course.university} - ${course.cost} USD</p>`;
    });

    resultsDiv.innerHTML += '<h2>10 Cheapest Options:</h2>';
    
    let cheapestCourses = data.cheapestCourses; // Adjust this to match your data structure
    cheapestCourses.forEach(course => {
        resultsDiv.innerHTML += `<p>${course.name} - ${course.university} - ${course.cost} USD</p>`;
    });
}
