import * as schedule from 'node-schedule'
import * as csv from 'csvtojson'

export type TripsService = Awaited<ReturnType<typeof create>>

interface CrewMember {
  id: number;
  name: string;
  position: string;
  phone?: string;
  experience: string;
}

export interface SeaTrip {
  type: "morningTraining" | "training" | "trainingrace" | "race" | "trip" | "commercial" | "ladoga"
  date: string;
  time: string;
  crew: CrewMember[];
  vessel: string;
  departure: string;
  estimatedReturn: string;
  destination: string;
  status: "planned" | "active" | "completed";
}

interface ActivityRegistration {
  date: string
  activityType: string
  participants: string[]
}

const create = async () => {
  // Локальное хранилище данных
  let currentTrips: SeaTrip[] = []
  let lastUpdated: Date | null = null

  // Функция для получения текущих поездок
  const getTrips = (): SeaTrip[] => {
    return [...currentTrips] // возвращаем копию массива
  }

  // Функция для получения информации о последнем обновлении
  const getLastUpdated = (): Date | null => {
    return lastUpdated
  }

  // Функция для обновления данных
  const updateTrips = async (): Promise<SeaTrip[]> => {
    try {
      console.log('=== Fetching CSV...')
      const csvText = await downloadCsvFile()
      const registrations = await parseCsv(csvText)
      const seaTrips = transformToSeaTrips(registrations)
      
      // Обновляем локальное хранилище
      currentTrips = seaTrips
      lastUpdated = new Date()
      
      console.log(`=== Updated ${seaTrips.length} trips at ${lastUpdated.toISOString()}`)
      return seaTrips
    } catch (error) {
      console.error('Error updating trips:', error)
      throw error
    }
  }

  // Инициализируем данные при создании сервиса
  console.log('=== Initial trips update...')
  await updateTrips()

  // Настраиваем cron job для обновления каждую минуту
  const job = schedule.scheduleJob('*/5 * * * *', async function () {
    try {
      await updateTrips()
    } catch (error) {
      console.error('Cron job error:', error)
    }
  })

  // Возвращаем API сервиса
  return {
    getTrips,
    getLastUpdated,
    updateTrips, // для ручного обновления если нужно
    stop: () => {
      if (job) {
        job.cancel()
        console.log('=== Trips service stopped')
      }
    }
  }
}

async function downloadCsvFile(): Promise<string> {
  const exportUrl = `https://docs.google.com/spreadsheets/d/1WKqAFEJ3_zdPZcPl1PS9nq8kJgmD6eIBJWkG7q5Cz7Q/export?format=csv&gid=883214049`
  const response = await fetch(exportUrl)
  return await response.text()
}

async function parseCsv(csvText: string): Promise<ActivityRegistration[]> {
  const rawRows: string[][] = await csv({ 
    noheader: true, 
    output: 'csv' 
  }).fromString(csvText)

//   console.log('Total rows:', rawRows.length)
//   console.log('Total columns in first row:', rawRows[0]?.length)
  
  // Найдем строки по содержимому, а не по индексу
  let monthsRowIndex = -1
  let daysRowIndex = -1  
  let activityRowIndex = -1
  let participantStartIndex = -1

  for (let i = 0; i < rawRows.length; i++) {
    const firstCell = rawRows[i][0]?.toString().toLowerCase()
    
    if (firstCell === 'дата') {
      daysRowIndex = i
    } else if (firstCell.includes('активность')) {
      activityRowIndex = i
    } else if (firstCell && !firstCell.includes('команде') && !firstCell.includes('дата') && 
               !firstCell.includes('день') && !firstCell.includes('активность') && 
               !firstCell.includes('часы') && !firstCell.includes('время') &&
               participantStartIndex === -1) {
      participantStartIndex = i
    }
  }

  // Месяцы в строке выше дней
  monthsRowIndex = daysRowIndex > 0 ? daysRowIndex - 2 : 0

//   console.log(`Found structure:`)
//   console.log(`- Months row: ${monthsRowIndex}`)
//   console.log(`- Days row: ${daysRowIndex}`) 
//   console.log(`- Activity row: ${activityRowIndex}`)
//   console.log(`- Participants start: ${participantStartIndex}`)

  const months = rawRows[monthsRowIndex] || []
  const days = rawRows[daysRowIndex] || []
  const activityTypes = rawRows[activityRowIndex] || []
  const participantRows = rawRows.slice(participantStartIndex, participantStartIndex + 31) // берем 31 участника

//   console.log('Months row (first 30):', months.slice(0, 30))
//   console.log('Days row (first 30):', days.slice(0, 30))
//   console.log('Activity types row (first 30):', activityTypes.slice(0, 30))
//   console.log('Participant rows count:', participantRows.length)

  // Создаем заголовки дат с типами активности
  const dateActivityHeaders: Array<{ date: string, activityType: string }> = []
  
  // Протягиваем месяц для объединенных ячеек
  let currentMonth = ''
  
  console.log('Creating date headers...')
  for (let colIndex = 1; colIndex < Math.min(months.length, days.length, activityTypes.length); colIndex++) {
    const monthCell = months[colIndex]?.trim()
    const day = days[colIndex]?.trim()
    const activityType = activityTypes[colIndex]?.trim()
    
    // Если в ячейке есть месяц - обновляем текущий месяц
    if (monthCell) {
      currentMonth = monthCell
      if (currentMonth === 'май') continue
      console.log(`Found month: "${currentMonth}" at column ${colIndex}`)
    }
    
    // Пропускаем, если нет дня или типа активности
    if (!day || !activityType || !currentMonth) {
      if (colIndex < 50) { // логируем первые 50 колонок для отладки
        console.log(`Column ${colIndex}: month="${currentMonth}", day="${day}", activity="${activityType}" - SKIPPED`)
      }
      continue
    }

    const monthNum = getMonthNumber(currentMonth)
    if (!monthNum) {
      console.log(`Unknown month: "${currentMonth}"`)
      continue
    }

    const date = `2025-${monthNum}-${day.padStart(2, '0')}`
    dateActivityHeaders.push({ date, activityType })
    
    if (dateActivityHeaders.length < 20) { // логируем первые 20
      console.log(`Column ${colIndex}: ${date} (${activityType})`)
    }
  }

//   console.log('Date-Activity headers:', dateActivityHeaders)

  // Группируем регистрации по дате и типу активности
  const registrationMap = new Map<string, ActivityRegistration>()

  console.log('Processing participants...')
  for (let rowIndex = 0; rowIndex < participantRows.length; rowIndex++) {
    const row = participantRows[rowIndex]
    const participantName = row[0]?.trim()
    
    // if (rowIndex < 3) { // показываем первые 3 строки участников полностью
    //   console.log(`Row ${participantStartIndex + rowIndex}: participant="${participantName}"`)
    //   console.log(`Full row data (${row.length} columns):`, row)
    // }
    
    if (!participantName) continue

    for (let colIndex = 1; colIndex < row.length && colIndex - 1 < dateActivityHeaders.length; colIndex++) {
      const mark = row[colIndex]?.trim()
      const headerInfo = dateActivityHeaders[colIndex - 1]
      
      if (mark === '1' && headerInfo) {
        // console.log(`Found registration: ${participantName} -> ${headerInfo.date} (${headerInfo.activityType})`)
        
        const key = `${headerInfo.date}-${headerInfo.activityType}`
        
        if (!registrationMap.has(key)) {
          registrationMap.set(key, {
            date: headerInfo.date,
            activityType: headerInfo.activityType,
            participants: []
          })
        }
        
        registrationMap.get(key)!.participants.push(participantName)
      }
    }
  }

  return Array.from(registrationMap.values())
}

function getMonthNumber(monthName: string): string | null {
  const map: Record<string, string> = {
    'январь': '01',
    'февраль': '02', 
    'март': '03',
    'апрель': '04',
    'май': '05',
    'июнь': '06',
    'июль': '07',
    'август': '08',
    'сентябрь': '09',
    'октябрь': '10',
    'ноябрь': '11',
    'декабрь': '12'
  }

  return map[monthName.toLowerCase()] || null
}

// Дополнительная функция для группировки по дате
export function groupByDate(registrations: ActivityRegistration[]): Record<string, ActivityRegistration[]> {
  return registrations.reduce((acc, registration) => {
    if (!acc[registration.date]) {
      acc[registration.date] = []
    }
    acc[registration.date].push(registration)
    return acc
  }, {} as Record<string, ActivityRegistration[]>)
}

// Дополнительная функция для группировки по типу активности
export function groupByActivity(registrations: ActivityRegistration[]): Record<string, ActivityRegistration[]> {
  return registrations.reduce((acc, registration) => {
    if (!acc[registration.activityType]) {
      acc[registration.activityType] = []
    }
    acc[registration.activityType].push(registration)
    return acc
  }, {} as Record<string, ActivityRegistration[]>)
}

function transformToSeaTrips(registrations: ActivityRegistration[]): SeaTrip[] {
  const seaTrips: SeaTrip[] = []
  let memberId = 1

  for (const registration of registrations) {
    // Преобразуем тип активности
    const activityType = mapActivityType(registration.activityType)
    if (!activityType) continue

    // Создаем экипаж из участников
    const crew: CrewMember[] = registration.participants.map(name => ({
      id: memberId++,
      name: name,
      position: name === 'Курочкина Ольга' ? 'Боцман' : 'Матрос', // можно добавить логику определения должности
      experience: "Не указан" // можно добавить логику определения опыта
    }))

    // Определяем время в зависимости от типа активности
    const time = getDefaultTime(activityType)
    const { departure, estimatedReturn } = getDefaultSchedule(activityType)

    const seaTrip: SeaTrip = {
      type: activityType,
      date: registration.date,
      time: time,
      crew: crew,
      vessel: "Орион",
      departure: departure,
      estimatedReturn: estimatedReturn,
      destination: "море",
      status: "planned"
    }

    seaTrips.push(seaTrip)
  }

  return seaTrips.sort((a, b) => a.date.localeCompare(b.date))
}

function mapActivityType(csvType: string): SeaTrip['type'] | null {
  const typeMap: Record<string, SeaTrip['type']> = {
    'УТ': 'morningTraining',
    'Т': 'training', 
    'ТГ': 'trainingrace',
    'Г': 'race',
    'П': 'trip',
    'К': 'commercial',
    'Л': 'ladoga'
  }
  
  return typeMap[csvType] || null
}

function getDefaultPosition(name: string): string {
  // Простая логика - можно расширить
  const positions = ["Рыбак", "Боцман", "Механик", "Капитан"]
  return positions[Math.floor(Math.random() * positions.length)]
}

function getDefaultTime(activityType: SeaTrip['type']): string {
  const timeMap: Record<SeaTrip['type'], string> = {
    'morningTraining': '06:00',
    'training': '08:00',
    'trainingrace': '07:00',
    'race': '18:30',
    'trip': '09:00',
    'commercial': '07:00',
    'ladoga': '06:00'
  }
  
  return timeMap[activityType]
}

function getDefaultSchedule(activityType: SeaTrip['type']): { departure: string, estimatedReturn: string } {
  const scheduleMap: Record<SeaTrip['type'], { departure: string, estimatedReturn: string }> = {
    'morningTraining': { departure: '06:00', estimatedReturn: '09:00' },
    'training': { departure: '19:00', estimatedReturn: '22:00' },
    'trainingrace': { departure: '18:30', estimatedReturn: '22:00' },
    'race': { departure: '10:00', estimatedReturn: '18:00' },
    'trip': { departure: '08:30', estimatedReturn: '18:30' },
    'commercial': { departure: '06:30', estimatedReturn: '17:30' },
    'ladoga': { departure: '05:00', estimatedReturn: '20:00' }
  }
  
  return scheduleMap[activityType]
}

export default { create }
export { transformToSeaTrips, mapActivityType }