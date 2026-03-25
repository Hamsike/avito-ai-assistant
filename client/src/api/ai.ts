import axios from 'axios'
import type { AdFormData, Category, GeneratedPrice } from '../types'

const ollamaClient = axios.create({
  baseURL: import.meta.env.VITE_OLLAMA_URL || 'http://localhost:11434',
  timeout: 30000,
})

const externalClient = axios.create({
  baseURL: import.meta.env.VITE_GROK_API_URL || 'https://api.x.ai/v1',
  timeout: 30000,
  headers: {
    'Authorization': `Bearer ${import.meta.env.VITE_GROK_API_KEY}`,
    'Content-Type': 'application/json',
  },
})

const aiProvider = import.meta.env.VITE_AI_PROVIDER || 'ollama'
const aiClient = aiProvider === 'ollama' ? ollamaClient : externalClient

// Промпт для генерации описания
const buildDescriptionPrompt = (ad: AdFormData): string => {
  const categoryText = ad.category === 'electronics' ? 'электроники' : 
                       ad.category === 'auto' ? 'автомобиля' : 'недвижимости'
  
  let paramsText = ''
  const params = ad.params || {}
  
  if (ad.category === 'electronics') {
    const p = params as any
    paramsText = `
Характеристики товара:
- Тип: ${p.type === 'phone' ? 'смартфон' : p.type === 'laptop' ? 'ноутбук' : p.type === 'misc' ? 'устройство' : 'не указан'}
- Бренд: ${p.brand || 'не указан'}
- Модель: ${p.model || 'не указана'}
- Состояние: ${p.condition === 'new' ? 'новый' : p.condition === 'used' ? 'б/у' : 'не указано'}
- Цвет: ${p.color || 'не указан'}`
  } else if (ad.category === 'auto') {
    const p = params as any
    paramsText = `
Характеристики автомобиля:
- Марка: ${p.brand || 'не указана'}
- Модель: ${p.model || 'не указана'}
- Год выпуска: ${p.yearOfManufacture || 'не указан'}
- Коробка передач: ${p.transmission === 'automatic' ? 'автомат' : p.transmission === 'manual' ? 'механика' : 'не указана'}
- Пробег: ${p.mileage ? `${p.mileage.toLocaleString()} км` : 'не указан'}
- Мощность: ${p.enginePower ? `${p.enginePower} л.с.` : 'не указана'}`
  } else if (ad.category === 'real_estate') {
    const p = params as any
    paramsText = `
Характеристики недвижимости:
- Тип: ${p.type === 'flat' ? 'квартира' : p.type === 'house' ? 'дом' : p.type === 'room' ? 'комната' : 'не указан'}
- Адрес: ${p.address || 'не указан'}
- Площадь: ${p.area ? `${p.area} м²` : 'не указана'}
- Этаж: ${p.floor ? `${p.floor}` : 'не указан'}`
  }

  return `Ты профессиональный копирайтер на русском языке. Напиши продающее описание для объявления.

Название товара: ${ad.title}
Цена: ${ad.price.toLocaleString()} рублей
Категория: ${categoryText}
${paramsText}

Требования:
- Пиши ТОЛЬКО на русском языке
- Используй продающие, убедительные фразы
- Выдели ключевые преимущества
- Будь конкретным и информативным
- Добавь эмоциональную составляющую
- Длина: 100-200 слов
- Не используй markdown разметку
- Начни с привлекательного заголовка

Напиши описание:`
}

// Улучшенный промпт для определения цены
const buildPricePrompt = (ad: AdFormData): string => {
  const params = ad.params || {}
  const condition = (params as any).condition === 'new' ? 'новый' : 
                    (params as any).condition === 'used' ? 'б/у' : 'состояние не указано'
  
  let specsText = ''
  
  if (ad.category === 'electronics') {
    const p = params as any
    specsText = `
- Бренд: ${p.brand || 'не указан'}
- Модель: ${p.model || 'не указана'}
- Тип: ${p.type === 'phone' ? 'смартфон' : p.type === 'laptop' ? 'ноутбук' : 'устройство'}
- Состояние: ${condition}
- Год выпуска: ${p.yearOfManufacture || 'не указан'}`
  } else if (ad.category === 'auto') {
    const p = params as any
    specsText = `
- Марка: ${p.brand || 'не указана'}
- Модель: ${p.model || 'не указана'}
- Год выпуска: ${p.yearOfManufacture || 'не указан'}
- Пробег: ${p.mileage ? `${p.mileage.toLocaleString()} км` : 'не указан'}
- Состояние: ${condition}`
  } else if (ad.category === 'real_estate') {
    const p = params as any
    specsText = `
- Тип: ${p.type === 'flat' ? 'квартира' : p.type === 'house' ? 'дом' : 'комната'}
- Площадь: ${p.area ? `${p.area} м²` : 'не указана'}
- Состояние: ${condition}`
  }

  return `Ты эксперт по оценке товаров на вторичном рынке в России.

Внимание! Текущая цена товара: ${ad.price.toLocaleString()} ₽
Эта цена уже установлена продавцом. Твоя задача - определить, насколько она соответствует рынку.

Информация о товаре:
Название: ${ad.title}
Категория: ${ad.category === 'electronics' ? 'Электроника' : ad.category === 'auto' ? 'Автомобили' : 'Недвижимость'}
${specsText}

Правила оценки:
- Если товар НОВЫЙ: цена должна быть 90-100% от рыночной
- Если товар Б/У в идеальном состоянии: цена 75-90% от новой
- Если товар Б/У с небольшими следами использования: цена 60-75% от новой
- Если товар Б/У требует ремонта: цена 40-60% от новой

Важно:
- НЕ ЗАНИЖАЙ цену без причины
- Если товар в отличном состоянии, цена должна быть близка к рыночной
- Учитывай популярность бренда и модели
- Сравни с текущей ценой продавца

Ответь ТОЛЬКО одним целым числом в рублях.
Цена должна быть реалистичной для продажи.

Рекомендуемая цена:`
}

// Умная нормализация цены
const normalizePrice = (price: number, ad: AdFormData): number => {
  let normalized = price
  
  // Получаем примерную базовую цену из текущей цены
  const currentPrice = ad.price
  
  // Если AI вернул цену, которая сильно отличается от текущей
  if (price > currentPrice * 1.5) {
    // Слишком высокая цена - ограничиваем
    normalized = currentPrice * 1.3
  } else if (price < currentPrice * 0.7) {
    // Слишком низкая цена - поднимаем
    normalized = currentPrice * 0.85
  }
  
  // Категорийные ограничения
  if (ad.category === 'electronics') {
    // Электроника: минимум 500, максимум 500000
    normalized = Math.min(Math.max(normalized, 500), 500000)
    // Округляем до сотен
    normalized = Math.round(normalized / 100) * 100
  } else if (ad.category === 'auto') {
    // Автомобили: минимум 50000, максимум 10000000
    normalized = Math.min(Math.max(normalized, 50000), 10000000)
    // Округляем до тысяч
    normalized = Math.round(normalized / 1000) * 1000
  } else if (ad.category === 'real_estate') {
    // Недвижимость: минимум 500000, максимум 50000000
    normalized = Math.min(Math.max(normalized, 500000), 50000000)
    // Округляем до десятков тысяч
    normalized = Math.round(normalized / 10000) * 10000
  }
  
  // Дополнительная проверка: если цена всё ещё слишком низкая
  if (normalized < currentPrice * 0.5 && currentPrice > 0) {
    normalized = currentPrice * 0.7
  }
  
  return normalized
}

export const aiApi = {
  generateDescription: async (ad: AdFormData): Promise<string> => {
    try {
      const prompt = buildDescriptionPrompt(ad)
      
      if (aiProvider === 'ollama') {
        const response = await aiClient.post('/api/generate', {
          model: import.meta.env.VITE_OLLAMA_MODEL || 'llama3',
          prompt,
          stream: false,
          options: {
            temperature: 0.7,
            top_p: 0.9,
            max_tokens: 800,
          },
        })
        return response.data.response.trim()
      } else {
        const response = await aiClient.post('/chat/completions', {
          model: 'grok-1',
          messages: [
            {
              role: 'system',
              content: 'Ты профессиональный копирайтер на русском языке. Отвечай только на русском языке.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 800,
        })
        return response.data.choices[0].message.content.trim()
      }
    } catch (error) {
      throw new Error('Не удалось сгенерировать описание')
    }
  },

  suggestPrice: async (ad: AdFormData): Promise<GeneratedPrice> => {
    try {
      const prompt = buildPricePrompt(ad)
      
      let priceText: string
      
      if (aiProvider === 'ollama') {
        const response = await aiClient.post('/api/generate', {
          model: import.meta.env.VITE_OLLAMA_MODEL || 'llama3',
          prompt,
          stream: false,
          options: {
            temperature: 0.4,
            top_p: 0.9,
            max_tokens: 50,
          },
        })
        priceText = response.data.response.trim()
      } else {
        const response = await aiClient.post('/chat/completions', {
          model: 'grok-1',
          messages: [
            {
              role: 'system',
              content: 'Ты эксперт по оценке товаров. Отвечай только числом в рублях. Цена должна быть реалистичной.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.4,
          max_tokens: 50,
        })
        priceText = response.data.choices[0].message.content.trim()
      }

      // Извлекаем число из ответа
      const priceMatch = priceText.match(/\d+/g)
      let suggestedPrice = ad.price
      
      if (priceMatch) {
        suggestedPrice = parseInt(priceMatch.join(''), 10)
      }
      
      // Нормализуем цену
      suggestedPrice = normalizePrice(suggestedPrice, ad)
      
      const difference = suggestedPrice - ad.price
      const percentage = (difference / ad.price) * 100

      return {
        suggested: suggestedPrice,
        current: ad.price,
        difference,
        percentage,
        recommendation: difference > 0 ? 'выше' : difference < 0 ? 'ниже' : 'равна',
      }
    } catch (error) {
      throw new Error('Не удалось определить рыночную цену')
    }
  },
}
