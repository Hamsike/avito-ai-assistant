import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Form, Input, InputNumber, theme, Select, Button, Space, Card, Typography, Spin, Divider, message, Switch, Tooltip, Modal, ConfigProvider, App } from 'antd'
import { ArrowLeftOutlined, SaveOutlined, CloseOutlined, ThunderboltOutlined, DollarOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { useAppDispatch, useAppSelector } from '@/hooks/redux'
import { saveDraft, clearDraft, setCurrentDraft } from '@/slices/draftSlice'
import { useAd, useUpdateAd } from '@/hooks/useAds'
import { useGenerateDescription, useSuggestPrice } from '@/hooks/useAI'
import type { AdFormData, Category, ElectronicsParams, AutoParams, RealEstateParams } from '@/types'
import styles from './AdForm.module.css'

const { Title, Text } = Typography
const { TextArea } = Input

const categoryOptions = [
  { value: 'electronics', label: 'Электроника' },
  { value: 'auto', label: 'Транспорт' },
  { value: 'real_estate', label: 'Недвижимость' },
]

type FieldConfig = {
  name: string
  label: string
  type: 'select' | 'input' | 'number'
  options?: { value: string; label: string }[]
}

const getCategoryFields = (category: Category): FieldConfig[] => {
  switch (category) {
    case 'electronics':
      return [
        {
          name: 'type', label: 'Тип', type: 'select', options: [
            { value: 'phone', label: 'Смартфон' },
            { value: 'laptop', label: 'Ноутбук' },
            { value: 'misc', label: 'Другое' },
          ]
        },
        { name: 'brand', label: 'Бренд', type: 'input' },
        { name: 'model', label: 'Модель', type: 'input' },
        {
          name: 'condition', label: 'Состояние', type: 'select', options: [
            { value: 'new', label: 'Новый' },
            { value: 'used', label: 'Б/У' },
          ]
        },
        { name: 'color', label: 'Цвет', type: 'input' },
      ]
    case 'auto':
      return [
        { name: 'brand', label: 'Марка', type: 'input' },
        { name: 'model', label: 'Модель', type: 'input' },
        { name: 'yearOfManufacture', label: 'Год выпуска', type: 'number' },
        {
          name: 'transmission', label: 'Коробка передач', type: 'select', options: [
            { value: 'automatic', label: 'Автомат' },
            { value: 'manual', label: 'Механика' },
          ]
        },
        { name: 'mileage', label: 'Пробег (км)', type: 'number' },
        { name: 'enginePower', label: 'Мощность (л.с.)', type: 'number' },
      ]
    case 'real_estate':
      return [
        {
          name: 'type', label: 'Тип', type: 'select', options: [
            { value: 'flat', label: 'Квартира' },
            { value: 'house', label: 'Дом' },
            { value: 'room', label: 'Комната' },
          ]
        },
        { name: 'address', label: 'Адрес', type: 'input' },
        { name: 'area', label: 'Площадь (м²)', type: 'number' },
        { name: 'floor', label: 'Этаж', type: 'number' },
      ]
    default:
      return []
  }
}

interface FormValues {
  category: Category
  title: string
  price: number
  description?: string
  [key: string]: any
}

export const AdForm: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [form] = Form.useForm<FormValues>()

  const { data: ad, isLoading: isLoadingAd } = useAd(id!)
  const updateAd = useUpdateAd()
  const generateDescription = useGenerateDescription()
  const suggestPrice = useSuggestPrice()

  const draft = useAppSelector((state) => state.draft.drafts[id!])
  const [category, setCategory] = useState<Category>('electronics')
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true)
  const [descriptionLength, setDescriptionLength] = useState(0)
  const [isSaving, setIsSaving] = useState(false)

  const isInitialLoad = useRef(true)
  const autoSaveTimer = useRef<NodeJS.Timeout>()
  const autoSaveInterval = useRef<NodeJS.Timeout>()
  const { token } = theme.useToken()
  const { modal } = App.useApp()

  // Вспомогательная функция для безопасного преобразования в число
  const safeNumber = (value: any, defaultValue: number = 0): number => {
    if (value === null || value === undefined) return defaultValue
    const num = typeof value === 'number' ? value : Number(value)
    return isNaN(num) ? defaultValue : num
  }

  const getFormData = (values: FormValues): AdFormData => {
    let params: ElectronicsParams | AutoParams | RealEstateParams = {}
    const fields = getCategoryFields(values.category)
    fields.forEach(field => {
      const fieldValue = values[field.name]
      if (fieldValue !== undefined && fieldValue !== null && fieldValue !== '') {
        params = { ...params, [field.name]: fieldValue }
      }
    })

    return {
      category: values.category,
      title: values.title,
      price: safeNumber(values.price, 0),
      description: values.description || '',
      params,
    }
  }

  const saveCurrentDraft = () => {
    if (!autoSaveEnabled) return
    
    const values = form.getFieldsValue()
    if (values.title && values.title.trim() !== '') {
      const draftData = getFormData(values)
      dispatch(saveDraft({ id: id!, data: draftData }))
    }
  }

  useEffect(() => {
    if (!ad || !isInitialLoad.current) return

    if (draft) {
      const formValues: any = {
        category: draft.category,
        title: draft.title,
        description: draft.description || '',
        price: safeNumber(draft.price, 0),
        ...draft.params,
      }
      
      form.setFieldsValue(formValues)
      setCategory(draft.category)
      setDescriptionLength(draft.description?.length || 0)
      
      message.success('Восстановлен черновик', 2)
    } else {
      const formValues: any = {
        category: ad.category,
        title: ad.title,
        description: ad.description || '',
        price: safeNumber(ad.price, 0),
        ...ad.params,
      }
      
      form.setFieldsValue(formValues)
      setCategory(ad.category)
      setDescriptionLength(ad.description?.length || 0)
    }

    dispatch(setCurrentDraft(id!))
    isInitialLoad.current = false
  }, [ad, draft, form, dispatch, id])

  useEffect(() => {
    if (autoSaveInterval.current) {
      clearInterval(autoSaveInterval.current)
    }
    
    if (autoSaveEnabled) {
      autoSaveInterval.current = setInterval(() => {
        const values = form.getFieldsValue()
        if (values.title && values.title.trim() !== '') {
          const draftData = getFormData(values)
          dispatch(saveDraft({ id: id!, data: draftData }))
        }
      }, 30000)
    }

    return () => {
      if (autoSaveInterval.current) {
        clearInterval(autoSaveInterval.current)
      }
    }
  }, [autoSaveEnabled, form, id, dispatch])

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (autoSaveEnabled) {
        const values = form.getFieldsValue()
        if (values.title && values.title.trim() !== '') {
          const draftData = getFormData(values)
          dispatch(saveDraft({ id: id!, data: draftData }))
        }
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [form, id, dispatch, autoSaveEnabled])

  const handleCategoryChange = (value: Category) => {
    setCategory(value)
    form.setFieldValue('category', value)
    const fields = getCategoryFields(value)
    fields.forEach(field => {
      form.setFieldValue(field.name, undefined)
    })
  }

  const handleGenerateDescription = async () => {
    const values = form.getFieldsValue()
    
    if (!values.title || values.title.trim() === '') {
      message.warning('Сначала заполните название товара')
      return
    }
    
    try {
      const hideLoading = message.loading('Генерируем описание...', 0)
      const description = await generateDescription.mutateAsync(values as AdFormData)
      hideLoading()
      
      modal.confirm({
        title: '✨ Сгенерированное описание',
        content: (
          <div style={{ 
            maxHeight: '400px', 
            overflow: 'auto', 
            whiteSpace: 'pre-wrap', 
            marginTop: '16px',
            padding: '16px',
            borderRadius: '8px',
            backgroundColor: token.colorBgContainer
          }}>
            <Text style={{ fontSize: '14px', lineHeight: '1.6', color: token.colorText }}>
              {description}
            </Text>
          </div>
        ),
        okText: '✅ Применить',
        cancelText: '❌ Отмена',
        width: 600,
        centered: true,
        onOk: () => {
          form.setFieldValue('description', description)
          setDescriptionLength(description.length)
          message.success('Описание применено')
          saveCurrentDraft()
        },
        onCancel: () => {
          message.info('Генерация отменена')
        },
      })
    } catch (error) {
      message.error('Не удалось сгенерировать описание. Проверьте подключение к Ollama.')
    }
  }

  const handleSuggestPrice = async () => {
    const values = form.getFieldsValue()
    
    if (!values.title || values.title.trim() === '') {
      message.warning('Сначала заполните название товара')
      return
    }
    
    try {
      const hideLoading = message.loading('Анализируем рыночные цены...', 0)
      const priceSuggestion = await suggestPrice.mutateAsync(values as AdFormData)
      hideLoading()
      
      const formatNumber = (num: number) => num.toLocaleString('ru-RU')
      const isHigher = priceSuggestion.difference > 0
      const isLower = priceSuggestion.difference < 0
      
      modal.confirm({
        title: '💰 Анализ рыночной цены',
        width: 520,
        centered: true,
        icon: null,
        content: (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '16px',
              backgroundColor: token.colorBgContainer
            }}>
              <Text style={{ fontWeight: 500, color: token.colorTextSecondary }}>Ваша цена:</Text>
              <Text style={{ fontSize: '20px', fontWeight: 600, color: token.colorText }}>
                {formatNumber(priceSuggestion.current)} ₽
              </Text>
            </div>
            
            <div style={{
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '16px',
              backgroundColor: isHigher ? token.colorSuccessBg : isLower ? token.colorWarningBg : token.colorPrimaryBg,
              border: `1px solid ${isHigher ? token.colorSuccessBorder : isLower ? token.colorWarningBorder : token.colorPrimaryBorder}`
            }}>
              <Text style={{
                display: 'block',
                marginBottom: '12px',
                fontSize: '16px',
                fontWeight: 600,
                color: isHigher ? token.colorSuccess : isLower ? token.colorWarning : token.colorPrimary
              }}>
                {isHigher ? '📈 Рекомендуемая цена (выше текущей)' : 
                 isLower ? '📉 Рекомендуемая цена (ниже текущей)' : 
                 '✅ Рекомендуемая цена (оптимальная)'}
              </Text>
              <Text style={{
                fontSize: '24px',
                fontWeight: 600,
                display: 'block',
                marginBottom: '8px',
                color: token.colorText
              }}>
                {formatNumber(priceSuggestion.suggested)} ₽
              </Text>
              <Text style={{ color: token.colorTextSecondary, fontSize: '14px', lineHeight: '1.5' }}>
                {isHigher 
                  ? `💰 Ваша цена ниже рыночной! Вы можете увеличить цену до ${formatNumber(priceSuggestion.suggested)} ₽ и получить больше прибыли.`
                  : isLower
                  ? `⚠️ Ваша цена выше рыночной. Рекомендуем снизить цену до ${formatNumber(priceSuggestion.suggested)} ₽ для быстрой продажи.`
                  : `✅ Ваша цена соответствует рыночной. Отличное предложение!`}
              </Text>
            </div>
            
            <div style={{
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '16px',
              backgroundColor: token.colorBgContainer
            }}>
              <Text style={{ display: 'block', marginBottom: '12px', fontWeight: 600, color: token.colorText }}>
                📊 Детальный анализ:
              </Text>
              <div style={{ marginBottom: '8px', fontSize: '14px' }}>
                <span style={{ color: token.colorTextSecondary }}>• Разница: </span>
                <span style={{ 
                  fontWeight: 600,
                  color: isHigher ? token.colorSuccess : isLower ? token.colorWarning : token.colorTextSecondary
                }}>
                  {isHigher ? '+' : ''}{formatNumber(priceSuggestion.difference)} ₽
                  ({Math.abs(priceSuggestion.percentage).toFixed(1)}%)
                </span>
              </div>
              <div style={{ marginBottom: '8px', fontSize: '14px' }}>
                <span style={{ color: token.colorTextSecondary }}>• Рыночный диапазон: </span>
                <strong style={{ color: token.colorText }}>
                  {formatNumber(Math.floor(priceSuggestion.suggested * 0.85))} - {formatNumber(Math.floor(priceSuggestion.suggested * 1.15))} ₽
                </strong>
              </div>
              <div style={{ marginBottom: '8px', fontSize: '14px' }}>
                <span style={{ color: token.colorTextSecondary }}>• Рекомендация: </span>
                <span style={{ 
                  fontWeight: 600,
                  color: isHigher ? token.colorSuccess : isLower ? token.colorWarning : token.colorTextSecondary
                }}>
                  {isHigher ? 'Увеличить цену' : isLower ? 'Снизить цену' : 'Оставить как есть'}
                </span>
              </div>
            </div>
            
            <div style={{
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: token.colorBgContainer,
              borderLeft: `4px solid ${token.colorPrimary}`
            }}>
              <Text style={{ fontSize: '14px', color: token.colorTextSecondary, lineHeight: '1.5' }}>
                💡 {isHigher 
                  ? 'Ваш товар недооценён! Поднимите цену до рекомендуемой и получите больше прибыли.'
                  : isLower
                  ? 'Цена завышена. Снижение цены ускорит продажу и привлечёт больше покупателей.'
                  : 'Отличная цена! Ваше объявление готово к публикации.'}
              </Text>
            </div>
          </div>
        ),
        okText: '✅ Применить цену',
        cancelText: '❌ Отмена',
        onOk: () => {
          const newPrice = safeNumber(priceSuggestion.suggested, 0)
          form.setFieldValue('price', newPrice)
          // Принудительно запускаем валидацию поля price
          form.validateFields(['price'])
          message.success(`Цена обновлена: ${formatNumber(newPrice)} ₽`)
          saveCurrentDraft()
        },
        onCancel: () => {
          message.info('Цена не изменена')
        },
      })
    } catch (error) {
      console.error('Price suggestion error:', error)
      message.error('Не удалось определить рыночную цену. Проверьте подключение к Ollama.')
    }
  }

  const handleSubmit = async (values: FormValues) => {
    setIsSaving(true)
    
    try {
      const formData = getFormData(values)
      
      await updateAd.mutateAsync({ id: id!, data: formData })
      dispatch(clearDraft(id!))
      dispatch(setCurrentDraft(null))
      
      message.success({
        content: 'Объявление успешно сохранено!',
        icon: <CheckCircleOutlined />,
        duration: 2,
      })
      
      setTimeout(() => {
        navigate(`/ads/${id}`)
      }, 500)
    } catch (error) {
      message.error('Не удалось сохранить объявление')
      setIsSaving(false)
    }
  }

  const handleAutoSaveToggle = (checked: boolean) => {
    setAutoSaveEnabled(checked)
    if (!checked) {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current)
      }
    }
  }

  if (isLoadingAd) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" tip="Загрузка объявления..." />
      </div>
    )
  }

  const categoryFields = getCategoryFields(category)

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <Space direction="vertical" size="large" className={styles.content}>
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/ads/${id}`)}>
                Назад
              </Button>
              <Title level={3} className={styles.headerTitle}>
                Редактирование объявления
              </Title>
            </div>
            <div className={styles.headerRight}>
              <Tooltip title="Автосохранение">
                <Switch
                  checked={autoSaveEnabled}
                  onChange={handleAutoSaveToggle}
                  checkedChildren="Вкл"
                  unCheckedChildren="Выкл"
                />
              </Tooltip>
              {draft && autoSaveEnabled && (
                <span className={styles.draftIndicator}>
                  Черновик сохранён
                </span>
              )}
            </div>
          </div>

          <Divider className={styles.divider} />

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            className={styles.form}
            onValuesChange={() => {
              if (autoSaveEnabled && !isInitialLoad.current) {
                if (autoSaveTimer.current) {
                  clearTimeout(autoSaveTimer.current)
                }
                autoSaveTimer.current = setTimeout(() => {
                  const values = form.getFieldsValue()
                  if (values.title && values.title.trim() !== '') {
                    const draftData = getFormData(values)
                    dispatch(saveDraft({ id: id!, data: draftData }))
                  }
                }, 1000)
              }
            }}
          >
            <Form.Item
              name="category"
              label="Категория"
              rules={[{ required: true, message: 'Выберите категорию' }]}
              className={styles.formItem}
            >
              <Select
                options={categoryOptions}
                onChange={handleCategoryChange}
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="title"
              label="Название"
              rules={[
                { required: true, message: 'Введите название' },
                { min: 3, message: 'Минимум 3 символа' },
              ]}
              className={styles.formItem}
            >
              <Input size="large" placeholder="Введите название объявления" />
            </Form.Item>

            <Form.Item
  name="price"
  label="Цена"
  rules={[
    { required: true, message: 'Введите цену' },
    {
      validator: (_, value) => {
        const numValue = safeNumber(value, 0)
        if (numValue > 0) {
          return Promise.resolve()
        }
        return Promise.reject(new Error('Цена должна быть больше 0'))
      }
    }
  ]}
  className={styles.formItem}
>
  <div className={styles.priceWrapper}>
    <Form.Item 
      name="price" 
      noStyle
      getValueFromEvent={(value) => {
        // Обработка значения из InputNumber
        if (value === undefined || value === null) return 0
        return typeof value === 'number' ? value : Number(value)
      }}
    >
      <InputNumber
        size="large"
        min={0}
        step={100}
        className={styles.priceInput}
        placeholder="Введите цену в рублях"
        style={{ width: '100%' }}
      />
    </Form.Item>
    <Button
      size="large"
      icon={<DollarOutlined />}
      onClick={handleSuggestPrice}
      loading={suggestPrice.isPending}
      className={styles.priceButton}
    >
      Узнать цену
    </Button>
  </div>
</Form.Item>
            {categoryFields.map((field) => (
              <Form.Item
                key={field.name}
                name={field.name}
                label={field.label}
                className={styles.formItem}
              >
                {field.type === 'select' ? (
                  <Select
                    options={field.options}
                    placeholder={`Выберите ${field.label.toLowerCase()}`}
                    size="large"
                    allowClear
                  />
                ) : field.type === 'number' ? (
                  <InputNumber
                    size="large"
                    className={styles.priceInput}
                    placeholder={`Введите ${field.label.toLowerCase()}`}
                    min={field.name === 'yearOfManufacture' ? 1900 : 0}
                  />
                ) : (
                  <Input
                    size="large"
                    placeholder={`Введите ${field.label.toLowerCase()}`}
                  />
                )}
              </Form.Item>
            ))}

            <Form.Item
              name="description"
              label="Описание"
              extra={
                <Text type="secondary">
                  {descriptionLength} символов
                </Text>
              }
              className={styles.formItem}
            >
              <TextArea
                rows={6}
                placeholder="Введите описание объявления..."
                showCount
                maxLength={2000}
                onChange={(e) => setDescriptionLength(e.target.value.length)}
              />
            </Form.Item>

            <div className={styles.descriptionButtonWrapper}>
              <Button
                size="large"
                icon={<ThunderboltOutlined />}
                onClick={handleGenerateDescription}
                loading={generateDescription.isPending}
                className={styles.descriptionButton}
              >
                Придумать описание
              </Button>
            </div>

            <div className={styles.actionButtons}>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={isSaving || updateAd.isPending}
                size="large"
                className={styles.actionButton}
              >
                Сохранить
              </Button>
              <Button
                icon={<CloseOutlined />}
                onClick={() => navigate(`/ads/${id}`)}
                size="large"
                className={styles.actionButton}
              >
                Отмена
              </Button>
            </div>
          </Form>
        </Space>
      </Card>
    </div>
  )
}