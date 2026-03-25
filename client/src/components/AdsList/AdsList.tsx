import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAppDispatch, useAppSelector } from '@/hooks/redux'
import {
  setSearchQuery,
  toggleCategory,
  setNeedsRevisionOnly,
  resetFilters,
  setSort,
  setCurrentPage,
  setLayout,
  toggleSidebar,
} from '@/slices/uiSlice'
import { useAds } from '@/hooks/useAds'
import {
  Layout,
  Row,
  Col,
  Card,
  Input,
  Select,
  Button,
  Pagination,
  Switch,
  Badge,
  Typography,
  Space,
  Spin,
  Alert,
  Image,
  Tag,
  Empty,
  Tooltip,
} from 'antd'
import {
  SearchOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  FilterOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import type { Category } from '@/types'
import styles from './AdsList.module.css'

const { Title, Text } = Typography
const { Search } = Input
const { Option } = Select

const categoryLabels: Record<Category, string> = {
  electronics: 'Электроника',
  auto: 'Транспорт',
  real_estate: 'Недвижимость',
}

const categoryColors: Record<Category, string> = {
  electronics: 'blue',
  auto: 'green',
  real_estate: 'orange',
}

// Функция для русских текстов пагинации
const itemRender = (current: number, type: string, originalElement: React.ReactNode) => {
  if (type === 'prev') {
    return <a>← Предыдущая</a>
  }
  if (type === 'next') {
    return <a>Следующая →</a>
  }
  if (type === 'page') {
    return <a>{current}</a>
  }
  if (type === 'jump-prev' || type === 'jump-next') {
    return <a>•••</a>
  }
  return originalElement
}

export const AdsList: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const dispatch = useAppDispatch()

  const {
    searchQuery,
    categories,
    needsRevisionOnly,
    sortColumn,
    sortDirection,
    currentPage,
    itemsPerPage,
    layout,
    sidebarCollapsed,
  } = useAppSelector((state) => state.ui)

  const params = useMemo(
    () => ({
      q: searchQuery || undefined,
      categories: categories.length > 0 ? categories : undefined,
      needsRevision: needsRevisionOnly,
      sortColumn,
      sortDirection,
      limit: itemsPerPage,
      skip: (currentPage - 1) * itemsPerPage,
    }),
    [searchQuery, categories, needsRevisionOnly, sortColumn, sortDirection, currentPage, itemsPerPage]
  )

  const { data, isLoading, error, refetch } = useAds(params)

  React.useEffect(() => {
    return () => {
      queryClient.cancelQueries({ queryKey: ['ads'] })
    }
  }, [queryClient])

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" tip="Загрузка объявлений..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.container}>
        <Alert
          message="Ошибка загрузки"
          description="Не удалось загрузить объявления"
          type="error"
          showIcon
          action={
            <Button size="small" onClick={() => refetch()} icon={<ReloadOutlined />}>
              Повторить
            </Button>
          }
        />
      </div>
    )
  }

  const ads = data?.items || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / itemsPerPage)

  // Функция для смены страницы с прокруткой вверх
  const handlePageChange = (page: number) => {
    dispatch(setCurrentPage(page))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <Layout className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2} className={styles.headerTitle}>
              Мои объявления
              <Text type="secondary" className={styles.headerCount}>
                ({total})
              </Text>
            </Title>
          </Col>
          <Col>
            <Space className={styles.actionButtons}>
              <Tooltip title="Сетка">
                <Button
                  type={layout === 'grid' ? 'primary' : 'default'}
                  icon={<AppstoreOutlined />}
                  onClick={() => dispatch(setLayout('grid'))}
                />
              </Tooltip>
              <Tooltip title="Список">
                <Button
                  type={layout === 'list' ? 'primary' : 'default'}
                  icon={<UnorderedListOutlined />}
                  onClick={() => dispatch(setLayout('list'))}
                />
              </Tooltip>
              <Tooltip title="Фильтры">
                <Button
                  type={!sidebarCollapsed ? 'primary' : 'default'}
                  icon={<FilterOutlined />}
                  onClick={() => dispatch(toggleSidebar())}
                />
              </Tooltip>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Search and Sort */}
      <Card className={styles.searchCard}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Search
              placeholder="Поиск по названию..."
              value={searchQuery}
              onChange={(e) => dispatch(setSearchQuery(e.target.value))}
              enterButton={<SearchOutlined />}
              size="large"
              className={styles.searchInput}
            />
          </Col>
          <Col xs={24} md={12}>
            <Select
              placeholder="Сортировка"
              value={`${sortColumn}_${sortDirection}`}
              onChange={(val) => {
                const [col, dir] = val.split('_')
                dispatch(setSort({ column: col as any, direction: dir as any }))
              }}
              className={styles.sortSelect}
              size="large"
            >
              <Option value="createdAt_desc">Сначала новые</Option>
              <Option value="createdAt_asc">Сначала старые</Option>
              <Option value="title_asc">По названию (А-Я)</Option>
              <Option value="title_desc">По названию (Я-А)</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      <Row gutter={[24, 24]} className={styles.layoutRow}>
        {/* Sidebar */}
        {!sidebarCollapsed && (
          <Col xs={24} md={6} className={styles.sidebarCol}>
            <Card title="Фильтры" className={styles.sidebarCard}>
              <Space direction="vertical" size="large" className={styles.sidebarFilters}>
                <div className={styles.filterSection}>
                  <div className={styles.filterHeader}>
                    <Text strong>Категории</Text>
                    <Button 
                      type="link" 
                      size="small" 
                      onClick={() => dispatch(resetFilters())}
                      className={styles.resetButton}
                    >
                      Сбросить
                    </Button>
                  </div>
                  <Space direction="vertical" className={styles.filterCategories}>
                    {Object.entries(categoryLabels).map(([value, label]) => (
                      <Switch
                        key={value}
                        checked={categories.includes(value as Category)}
                        onChange={() => dispatch(toggleCategory(value as Category))}
                        checkedChildren={label}
                        unCheckedChildren={label}
                      />
                    ))}
                  </Space>
                </div>
                <Switch
                  checked={needsRevisionOnly}
                  onChange={(checked) => dispatch(setNeedsRevisionOnly(checked))}
                  checkedChildren="Только требующие доработок"
                  unCheckedChildren="Только требующие доработок"
                />
              </Space>
            </Card>
          </Col>
        )}

        {/* Ads List */}
        <Col 
          xs={24} 
          md={sidebarCollapsed ? 24 : 18}
          className={sidebarCollapsed ? styles.contentColFull : styles.contentCol}
        >
          {ads.length === 0 ? (
            <Empty 
              description="Объявления не найдены" 
              className={styles.emptyState}
            />
          ) : layout === 'grid' ? (
            <Row gutter={[16, 16]} className={styles.gridRow}>
              {ads.map((ad) => (
                <Col xs={24} sm={12} lg={8} key={ad.id} className={styles.gridCol}>
                  <Card 
                    onClick={() => navigate(`/ads/${ad.id}`)}
                    hoverable
                    className={styles.card}
                    cover={
                      <Image
                        alt={ad.title}
                        src={`https://placehold.co/400x200?text=${ad.category}`}
                        height={200}
                        className={styles.cardCover}
                        preview={false}
                      />
                    }
                  >
                    <Card.Meta
                      title={
                        <div className={styles.cardTitleContainer}>
                          <Text strong ellipsis className={styles.cardTitle}>
                            {ad.title}
                          </Text>
                          {ad.needsRevision && (
                            <Badge 
                              count="Требует доработок" 
                              style={{ backgroundColor: '#faad14' }}
                              className={styles.badge}
                            />
                          )}
                        </div>
                      }
                      description={
                        <>
                          <Tag color={categoryColors[ad.category]} className={styles.cardTag}>
                            {categoryLabels[ad.category]}
                          </Tag>
                          <Title level={4} type="danger" className={styles.cardPrice}>
                            {ad.price.toLocaleString()} ₽
                          </Title>
                        </>
                      }
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <Space direction="vertical" size={16} className={styles.listContainer}>
              {ads.map((ad) => (
                <Card 
                  key={ad.id} 
                  hoverable 
                  onClick={() => navigate(`/ads/${ad.id}`)}
                  className={styles.listItemCard}
                >
                  <Row gutter={16} align="middle">
                    <Col flex="80px">
                      <Image
                        src={`https://placehold.co/80x80?text=${ad.category}`}
                        width={80}
                        height={80}
                        className={styles.listItemImage}
                        preview={false}
                      />
                    </Col>
                    <Col flex="auto">
                      <Row justify="space-between" align="middle">
                        <Col>
                          <Text strong className={styles.listItemTitle}>
                            {ad.title}
                          </Text>
                          <div>
                            <Tag color={categoryColors[ad.category]} className={styles.listItemTag}>
                              {categoryLabels[ad.category]}
                            </Tag>
                            {ad.needsRevision && (
                              <Badge
                                count="Требует доработок"
                                className={styles.listItemBadge}
                                style={{ backgroundColor: '#faad14' }}
                              />
                            )}
                          </div>
                        </Col>
                        <Col>
                          <Title level={4} type="danger" className={styles.listItemPrice}>
                            {ad.price.toLocaleString()} ₽
                          </Title>
                        </Col>
                      </Row>
                    </Col>
                  </Row>
                </Card>
              ))}
            </Space>
          )}

          {/* Пагинация на русском языке, выровнена по левому краю */}
          {totalPages > 1 && (
            <div className={styles.paginationContainer}>
              <Pagination
                current={currentPage}
                total={total}
                pageSize={itemsPerPage}
                onChange={handlePageChange}
                showSizeChanger={false}
                showQuickJumper
                itemRender={itemRender}
                locale={{
                  items_per_page: '/ стр',
                  jump_to: 'Перейти к',
                  jump_to_confirm: 'подтвердить',
                  page: 'страница',
                  prev_page: 'Предыдущая страница',
                  next_page: 'Следующая страница',
                  prev_5: 'Предыдущие 5 страниц',
                  next_5: 'Следующие 5 страниц',
                }}
              />
            </div>
          )}
        </Col>
      </Row>
    </Layout>
  )
}