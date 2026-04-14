import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"

const CourseMatchmakerApp = () => {
  const [formData, setFormData] = useState({
    subjectAreas: '',
    courseLevel: '',
    modeOfStudy: [],
    interests: '',
    skillSets: '',
    learningStyle: '',
    preferredLocations: '',
    specificInterests: '',
    searchWorldwide: false,
    searchCheapOptions: false
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: checked
    }));
  };

  const handleModeOfStudyChange = (e) => {
    const { value, checked } = e.target;
    setFormData(prevState => ({
      ...prevState,
      modeOfStudy: checked 
        ? [...prevState.modeOfStudy, value]
        : prevState.modeOfStudy.filter(mode => mode !== value)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Here you would typically send the data to a backend service
    // and then process the results to display matched courses
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Course Matchmaker</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="subjectAreas">Subject Areas</Label>
            <Input 
              id="subjectAreas" 
              name="subjectAreas"
              value={formData.subjectAreas}
              onChange={handleInputChange}
              placeholder="Enter subject areas"
            />
          </div>

          <div>
            <Label htmlFor="courseLevel">Course Level</Label>
            <Select 
              id="courseLevel" 
              name="courseLevel"
              value={formData.courseLevel}
              onChange={handleInputChange}
            >
              <option value="">Select course level</option>
              <option value="undergraduate">Undergraduate</option>
              <option value="postgraduate">Postgraduate</option>
              <option value="other">Other</option>
            </Select>
          </div>

          <div>
            <Label>Mode of Study</Label>
            <div className="flex space-x-4">
              {['Full-time', 'Part-time', 'Face-to-face', 'Online', 'Hybrid'].map((mode) => (
                <div key={mode} className="flex items-center">
                  <Checkbox 
                    id={mode}
                    name="modeOfStudy"
                    value={mode}
                    checked={formData.modeOfStudy.includes(mode)}
                    onCheckedChange={handleModeOfStudyChange}
                  />
                  <Label htmlFor={mode} className="ml-2">{mode}</Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="interests">Interests</Label>
            <Input 
              id="interests" 
              name="interests"
              value={formData.interests}
              onChange={handleInputChange}
              placeholder="Enter your interests"
            />
          </div>

          <div>
            <Label htmlFor="skillSets">Skill Sets</Label>
            <Input 
              id="skillSets" 
              name="skillSets"
              value={formData.skillSets}
              onChange={handleInputChange}
              placeholder="Enter your skill sets"
            />
          </div>

          <div>
            <Label htmlFor="learningStyle">Preferred Learning Style</Label>
            <Input 
              id="learningStyle" 
              name="learningStyle"
              value={formData.learningStyle}
              onChange={handleInputChange}
              placeholder="Enter your preferred learning style"
            />
          </div>

          <div>
            <Label htmlFor="preferredLocations">Preferred Locations</Label>
            <Input 
              id="preferredLocations" 
              name="preferredLocations"
              value={formData.preferredLocations}
              onChange={handleInputChange}
              placeholder="Enter preferred locations"
            />
          </div>

          <div>
            <Label htmlFor="specificInterests">Specific Interests</Label>
            <Input 
              id="specificInterests" 
              name="specificInterests"
              value={formData.specificInterests}
              onChange={handleInputChange}
              placeholder="Enter any specific interests"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="searchWorldwide"
              name="searchWorldwide"
              checked={formData.searchWorldwide}
              onCheckedChange={handleCheckboxChange}
            />
            <Label htmlFor="searchWorldwide">Search programs worldwide</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="searchCheapOptions"
              name="searchCheapOptions"
              checked={formData.searchCheapOptions}
              onCheckedChange={handleCheckboxChange}
            />
            <Label htmlFor="searchCheapOptions">Search for cheap or free online options</Label>
          </div>

          <Button type="submit">Find Matching Courses</Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CourseMatchmakerApp;
