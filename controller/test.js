const ExcelJS = require('exceljs')
const fs = require('fs')

async function exportToExcel(data, filePath) {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Sheet 1')

    // Header
    worksheet.columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Email', key: 'email', width: 30 },
    ]

    // Isi data
    data.forEach(item => {
        worksheet.addRow(item)
    })

    await workbook.xlsx.writeFile(filePath)
    console.log(`Excel exported to ${filePath}`)
}

// Contoh data
const dummyData = [
    { id: 1, name: 'Budi', email: 'budi@example.com' },
    { id: 2, name: 'Ani', email: 'ani@example.com' }
]

// Ekspor
exportToExcel(dummyData, 'output.xlsx')
