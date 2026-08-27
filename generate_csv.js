const fs = require('fs');

const attendanceTestCases = [
    "Verify user can log in with valid credentials",
    "Verify user cannot log in with invalid credentials",
    "Verify teacher can view the list of students for a class",
    "Verify teacher can mark a student as present",
    "Verify teacher can mark a student as absent",
    "Verify teacher can mark a student as late",
    "Verify teacher can submit the attendance record for the day",
    "Verify student can view their own attendance history",
    "Verify student receives notification when marked absent",
    "Verify admin can add a new student to a class",
    "Verify admin can remove a student from a class",
    "Verify admin can generate monthly attendance reports",
    "Verify teacher can edit attendance before end of day",
    "Verify teacher cannot edit attendance after submission deadline",
    "Verify system calculates overall attendance percentage correctly"
];

let csvContent = 'Test Case ID,Description,Expected Result,Actual Result,Status\n';

for (let i = 1; i <= 300; i++) {
    const id = `TC-${String(i).padStart(3, '0')}`;
    const description = attendanceTestCases[(i - 1) % attendanceTestCases.length];
    csvContent += `${id},${description},Pass,Pass,Passed\n`;
}

fs.writeFileSync('fake_test_cases.csv', csvContent);
console.log('Successfully generated fake_test_cases.csv');
