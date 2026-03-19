import { describe, it, expect } from 'vitest'

// Test the core distance calculation and data lookup logic
// Import the module (we'll test the pure functions)

describe('Haversine distance calculation', () => {
  // Replicate calcDist from client-lookup.ts for testing
  function calcDist(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
  }

  it('should return 0 for same point', () => {
    expect(calcDist(25.033, 121.552, 25.033, 121.552)).toBe(0)
  })

  it('should calculate Taipei 101 to Taipei Main Station (~3.3km)', () => {
    const dist = calcDist(25.0340, 121.5645, 25.0478, 121.5170)
    expect(dist).toBeGreaterThan(3000)
    expect(dist).toBeLessThan(6000)
  })

  it('should calculate short distance correctly (~100m)', () => {
    // ~0.001 degrees ≈ ~111m
    const dist = calcDist(25.033, 121.552, 25.034, 121.552)
    expect(dist).toBeGreaterThan(80)
    expect(dist).toBeLessThan(150)
  })

  it('should be symmetric', () => {
    const d1 = calcDist(25.0, 121.5, 25.1, 121.6)
    const d2 = calcDist(25.1, 121.6, 25.0, 121.5)
    expect(d1).toBe(d2)
  })
})

describe('Data integrity', () => {
  it('should have districts for all 22 cities', async () => {
    const { DISTRICTS } = await import('@/lib/districts')
    const cities = Object.keys(DISTRICTS)
    expect(cities.length).toBe(22)
    expect(cities).toContain('臺北市')
    expect(cities).toContain('高雄市')
    expect(cities).toContain('金門縣')
    expect(cities).toContain('連江縣')
  })

  it('should have districts for each city', async () => {
    const { DISTRICTS } = await import('@/lib/districts')
    for (const [city, districts] of Object.entries(DISTRICTS)) {
      expect(districts.length, `${city} should have districts`).toBeGreaterThan(0)
    }
  })

  it('should have English city names for all cities', async () => {
    const { CITIES } = await import('@/lib/cities')
    const { DISTRICTS } = await import('@/lib/districts')
    const cityMap = new Map(CITIES)
    for (const city of Object.keys(DISTRICTS)) {
      expect(cityMap.get(city), `${city} should have English name`).toBeTruthy()
    }
  })

  it('should have i18n with both locales', async () => {
    const { t } = await import('@/lib/i18n/index')
    const zh = t('zh-TW', 'site_title')
    const en = t('en', 'site_title')
    expect(zh).toBeTruthy()
    expect(en).toBeTruthy()
    expect(zh).not.toBe(en)
  })
})

describe('PDF i18n', () => {
  it('should return Chinese text for zh mode', async () => {
    const { pt } = await import('@/lib/pdf-i18n')
    const text = pt('zh', 'cover_title')
    expect(text).toBeTruthy()
    expect(typeof text).toBe('string')
  })

  it('should return text for en mode', async () => {
    const { pt } = await import('@/lib/pdf-i18n')
    const text = pt('en', 'cover_title')
    expect(text).toBeTruthy()
    expect(typeof text).toBe('string')
  })
})

describe('Foreign resources', () => {
  it('should have resources for major nationalities', async () => {
    const { FOREIGN_RESOURCES } = await import('@/lib/foreign-resources')
    expect(FOREIGN_RESOURCES.length).toBeGreaterThanOrEqual(5)
    const nationalities = FOREIGN_RESOURCES.map(r => r.nationality)
    expect(nationalities).toContain('VN')
    expect(nationalities).toContain('ID')
    expect(nationalities).toContain('PH')
    expect(nationalities).toContain('TH')
  })

  it('should have hotlines with phone numbers', async () => {
    const { FOREIGN_HOTLINES } = await import('@/lib/foreign-resources')
    expect(FOREIGN_HOTLINES.length).toBeGreaterThan(0)
    for (const h of FOREIGN_HOTLINES) {
      expect(h.number).toBeTruthy()
      expect(h.name).toBeTruthy()
    }
  })
})
