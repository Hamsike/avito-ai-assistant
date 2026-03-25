import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAd } from '@/hooks/useAds'
import {
  Layout,
  Card,
  Button,
  Typography,
  Spin,
  Alert,
  Image,
  Table,
  List,
  Row,
  Col,
  Space,
} from 'antd'
import { ArrowLeftOutlined, EditOutlined, WarningOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import 'dayjs/locale/ru'
import type { Category } from '@/types'
import styles from './AdDetails.module.css'

const { Title, Text, Paragraph } = Typography

const categoryLabels: Record<Category, string> = {
  electronics: 'Электроника',
  auto: 'Транспорт',
  real_estate: 'Недвижимость',
}

// Форматирование параметров для таблицы
const formatParamsForTable = (category: Category, params: any) => {
  const paramLabels: Record<string, Record<string, string>> = {
    electronics: {
      type: 'Тип',
      brand: 'Бренд',
      model: 'Модель',
      condition: 'Состояние',
      color: 'Цвет',
    },
    auto: {
      brand: 'Марка',
      model: 'Модель',
      yearOfManufacture: 'Год выпуска',
      transmission: 'Коробка передач',
      mileage: 'Пробег',
      enginePower: 'Мощность',
    },
    real_estate: {
      type: 'Тип',
      address: 'Адрес',
      area: 'Площадь',
      floor: 'Этаж',
    },
  }

  const formatValue = (key: string, value: any): string => {
    if (key === 'mileage') return `${value.toLocaleString()} км`
    if (key === 'area') return `${value} м²`
    if (key === 'enginePower') return `${value} л.с.`
    if (key === 'condition') return value === 'new' ? 'Новый' : 'Б/У'
    if (key === 'transmission') return value === 'automatic' ? 'Автомат' : 'Механика'
    if (key === 'type') {
      const typeMap: Record<string, string> = {
        phone: 'Смартфон',
        laptop: 'Ноутбук',
        misc: 'Другое',
        flat: 'Квартира',
        house: 'Дом',
        room: 'Комната',
      }
      return typeMap[value] || value
    }
    return String(value)
  }

  const labels = paramLabels[category] || {}
  return Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => ({
      key: key,
      label: labels[key] || key,
      value: formatValue(key, value),
    }))
}

// Определение незаполненных полей
const getMissingFields = (ad: any): string[] => {
  const missing: string[] = []
  
  if (!ad.description || ad.description.trim() === '') {
    missing.push('Описание')
  }
  
  if (ad.category === 'electronics') {
    if (!ad.params?.brand) missing.push('Бренд')
    if (!ad.params?.model) missing.push('Модель')
    if (!ad.params?.condition) missing.push('Состояние')
    if (!ad.params?.color) missing.push('Цвет')
  } else if (ad.category === 'auto') {
    if (!ad.params?.brand) missing.push('Марка')
    if (!ad.params?.model) missing.push('Модель')
    if (!ad.params?.yearOfManufacture) missing.push('Год выпуска')
    if (!ad.params?.mileage) missing.push('Пробег')
  } else if (ad.category === 'real_estate') {
    if (!ad.params?.address) missing.push('Адрес')
    if (!ad.params?.area) missing.push('Площадь')
  }
  
  return missing
}

export const AdDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: ad, isLoading, error } = useAd(id!)

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" tip="Загрузка объявления..." />
      </div>
    )
  }

  if (error || !ad) {
    return (
      <Layout className={styles.errorContainer}>
        <Card>
          <Alert
            message="Ошибка загрузки"
            description="Не удалось загрузить объявление"
            type="error"
            showIcon
            action={
              <Button onClick={() => navigate('/ads')}>
                Вернуться к списку
              </Button>
            }
          />
        </Card>
      </Layout>
    )
  }

  const missingFields = getMissingFields(ad)
  const paramsList = formatParamsForTable(ad.category, ad.params)
  const needsRevision = missingFields.length > 0

  const formatDate = (date: string) => {
    return dayjs(date).locale('ru').format('DD MMMM HH:mm')
  }

  const columns = [
    {
      title: 'Характеристика',
      dataIndex: 'label',
      key: 'label',
      width: '40%',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'Значение',
      dataIndex: 'value',
      key: 'value',
      render: (text: string) => <Text>{text}</Text>,
    },
  ]

  const hasBeenUpdated = ad.updatedAt && ad.updatedAt !== ad.createdAt

  return (
    <Layout className={styles.container}>
      <Card className={styles.card}>
        {/* Навигация */}
        <div className={styles.navigation}>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/ads')}
          >
            Назад к списку объявлений
          </Button>
        </div>

        {/* Заголовок и цена */}
        <div className={styles.titleRow}>
          <Title level={2}>{ad.title}</Title>
          <Title level={2}>{ad.price.toLocaleString()} ₽</Title>
        </div>

        {/* Кнопка и дата */}
         <div className={styles.actionRow}>
          <Button 
            type="primary" 
            icon={<EditOutlined />}
            onClick={() => navigate(`/ads/${id}/edit`)}
          >
            Редактировать
          </Button>
          <div className={styles.dateColumn}>
            <Text type="secondary" className={styles.dateText}>
              Опубликовано: {formatDate(ad.createdAt)}
            </Text>
            {hasBeenUpdated && (
              <Text type="secondary" className={styles.dateTextEdited}>
                Отредактировано: {formatDate(ad.updatedAt)}
              </Text>
            )}
          </div>
        </div>

        {/* Категория */}
        <div className={styles.category}>
          <Text type="secondary">{categoryLabels[ad.category]}</Text>
        </div>

        {/* Основной блок */}
        <Row gutter={[32, 32]} className={styles.contentRow}>
          <Col xs={24} md={12}>
            <Image
              src={`https://placehold.co/600x400?text=${ad.category}`}
              alt={ad.title}
              className={styles.image}
              fallback="https://placehold.co/600x400?text=Нет+изображения"
            />
          </Col>

          <Col xs={24} md={12}>
            <Space direction="vertical" size="large" className={styles.sidebar}>
              {needsRevision && (
                <div className={styles.revisionAlert}>
                  <div className={styles.revisionHeader}>
                    <WarningOutlined className={styles.revisionIcon} />
                    <Text strong className={styles.revisionTitle}>
                      Требуются доработки
                    </Text>
                  </div>
                  <Text className={styles.revisionText}>
                    У объявления не заполнены поля:
                  </Text>
                  <List
                    size="small"
                    dataSource={missingFields}
                    renderItem={(field) => (
                      <List.Item className={styles.revisionListItem}>
                        <Text className={styles.revisionField}>• {field}</Text>
                      </List.Item>
                    )}
                    className={styles.revisionList}
                  />
                </div>
              )}

              {paramsList.length > 0 && (
                <div>
                  <Title level={4} className={styles.sectionTitle}>
                    Характеристики
                  </Title>
                  <Table
                    columns={columns}
                    dataSource={paramsList}
                    pagination={false}
                    size="middle"
                    bordered
                    className={styles.paramsTable}
                  />
                </div>
              )}
            </Space>
          </Col>
        </Row>

        {/* Описание */}
        <div>
          <Title level={4} className={styles.sectionTitle}>
            Описание
          </Title>
          <Paragraph className={styles.description}>
            {ad.description || 'Описание отсутствует'}
          </Paragraph>
        </div>
      </Card>
    </Layout>
  )
}