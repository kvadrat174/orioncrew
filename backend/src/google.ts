import { google } from 'googleapis'
import { JWT } from 'google-auth-library'
import fs from 'fs'
import path from 'path'

const SHEET_ID = '1WKqAFEJ3_zdPZcPl1PS9nq8kJgmD6eIBJWkG7q5Cz7Q'

// Укажите путь к вашему ключу сервисного аккаунта
const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, './curious-sandbox-298011-8f68322ffc7b.json'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
})

const sheets = google.sheets({ version: 'v4', auth })

export async function updateCell(sheetId: string, range: string, value = '') {
  const response = await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: range, // например "Лист1!W25"
    valueInputOption: 'RAW',
    requestBody: {
      values: [[value]],
    },
  })

  console.log(`Updated cell ${range} with value "${value}"`)
  return response.data
}

export async function downloadCsvFile(): Promise<string> {
    const exportUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=2056797853`
    const response = await fetch(exportUrl)
    return await response.text()
  }

export async function getSheetData() {
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: '2025 выходы команды (копия для теста)',
      })
      
      return response.data.values || []
    } catch (error) {
      console.error('Error reading sheet data:', error)
      throw error
    }
  }

  export function getColumnLetter(columnNumber: number): string {
    let letter = '';
    while (columnNumber > 0) {
        const remainder = (columnNumber - 1) % 26;
        letter = String.fromCharCode(65 + remainder) + letter;
        columnNumber = Math.floor((columnNumber - 1) / 26);
    }
    return letter;
}