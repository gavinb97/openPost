const xlsx = require('xlsx');
const path = require('path');

function filterMilkProducers(inputPath, outputDirectory) {
    // Load the workbook
    const workbook = xlsx.readFile(inputPath);

    // Get the first sheet
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convert the sheet to JSON
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    // Extract headers and data
    const headers = data[4]; // Row 5 (0-indexed is 4)
    const rows = data.slice(5); // All rows after the header

    // Filter rows based on the specified counties
    const filteredRows = rows.filter(row => {
        const county = row[headers.indexOf('County')];
        return ['Walworth', 'Kenosha', 'Rock', 'Racine', 'Jefferson', 'Waukesha'].includes(county);
    });

    // Add the header back to the filtered rows
    filteredRows.unshift(headers);

    // Create a new workbook and sheet
    const newWorkbook = xlsx.utils.book_new();
    const newSheet = xlsx.utils.aoa_to_sheet(filteredRows);

    // Append the new sheet to the workbook
    xlsx.utils.book_append_sheet(newWorkbook, newSheet, 'MilkProducers');

    // Write the new workbook to the output directory
    const outputPath = path.join(outputDirectory, 'MilkProducers.xlsx');
    xlsx.writeFile(newWorkbook, outputPath);

    console.log(`Filtered data saved to ${outputPath}`);
}

// Example usage
const inputPath = 'C:/Users/Gavin/Desktop/BuildABlog/openPost/OGv1Bots/milk/Milk_Producer_License_Holders.xlsx'; // Replace with the actual input path
const outputDirectory = 'C:/Users/Gavin/Desktop/BuildABlog/openPost/OGv1Bots/milk/'; // Replace with the actual output directory

filterMilkProducers(inputPath, outputDirectory);