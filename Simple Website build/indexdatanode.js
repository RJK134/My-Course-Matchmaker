const express = require('express');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json());

app.post('/find-courses', async (req, res) => {
    const { location, studyLevel, courseInterest, additionalInterests, budget } = req.body;

    // Fetch data from various sources
    // This is a simplified example; you need to implement actual fetching logic
    let courseData = await fetchCourseData(location, studyLevel, courseInterest, budget);

    res.json(courseData);
});

async function fetchCourseData(location, studyLevel, courseInterest, budget) {
    // Implement the logic to fetch and process data from provided URLs
    // This is a simplified placeholder
    let response = await fetch('https://api.example.com/course-data?location=' + location + '&studyLevel=' + studyLevel + '&courseInterest=' + courseInterest + '&budget=' + budget);
    let data = await response.json();
    
    // Process and filter data as needed
    return {
        topCourses: data.topCourses,
        cheapestCourses: data.cheapestCourses
    };
}

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});