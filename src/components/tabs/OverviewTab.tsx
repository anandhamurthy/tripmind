import { useEffect, useState } from 'react'
import { Cloud, Droplets, Plane, Wind } from 'lucide-react'
import { useActiveTrip } from '../../store/useTripStore'
import { formatDateSpan } from '../../lib/date'

/* ─── Weather helpers ──────────────────────────────────────────────────────── */

interface WeatherDay {
  date: string
  code: number
  tempMax: number
  tempMin: number
  precipPct: number
  windKmh: number
}

interface CurrentWeather {
  temp: number
  code: number
  windKmh: number
}

function weatherEmoji(code: number): string {
  if (code === 0) return '☀️'
  if (code <= 2) return '🌤️'
  if (code === 3) return '☁️'
  if (code <= 48) return '🌫️'
  if (code <= 55) return '🌦️'
  if (code <= 67) return '🌧️'
  if (code <= 77) return '❄️'
  if (code <= 82) return '🌦️'
  return '⛈️'
}

function weatherLabel(code: number): string {
  if (code === 0) return 'Clear sky'
  if (code <= 2) return 'Partly cloudy'
  if (code === 3) return 'Overcast'
  if (code <= 48) return 'Foggy'
  if (code <= 55) return 'Drizzle'
  if (code <= 67) return 'Rain'
  if (code <= 77) return 'Snow'
  if (code <= 82) return 'Showers'
  return 'Thunderstorm'
}

function weatherBg(code: number): string {
  if (code === 0) return 'bg-amber-light border-amber/30'
  if (code <= 2) return 'bg-[#EEF6FF] border-[#C0D9F5]'
  if (code === 3) return 'bg-[#F3F4F6] border-border'
  if (code <= 48) return 'bg-[#F3F4F6] border-border'
  return 'bg-[#EFF6FF] border-[#BFDBFE]'
}

/* ─── Greeting ─────────────────────────────────────────────────────────────── */

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good Morning'
  if (h < 17) return 'Good Afternoon'
  return 'Good Evening'
}

function daysUntil(dateStr: string): number {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - now.getTime()) / 86_400_000)
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

/* ─── Component ────────────────────────────────────────────────────────────── */

export default function OverviewTab() {
  const trip = useActiveTrip()
  const [daily, setDaily] = useState<WeatherDay[]>([])
  const [current, setCurrent] = useState<CurrentWeather | null>(null)
  const [weatherErr, setWeatherErr] = useState(false)

  /* Fetch Open-Meteo for the trip's city (London default fallback) */
  useEffect(() => {
    // London coords — good default for most Gartner events
    const lat = 51.5074
    const lon = -0.1278
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${lat}&longitude=${lon}` +
      `&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max,windspeed_10m_max` +
      `&current_weather=true&timezone=Europe%2FLondon&forecast_days=16`

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        const d = data.daily
        const days: WeatherDay[] = (d.time as string[]).map((date: string, i: number) => ({
          date,
          code: d.weathercode[i],
          tempMax: Math.round(d.temperature_2m_max[i]),
          tempMin: Math.round(d.temperature_2m_min[i]),
          precipPct: d.precipitation_probability_max[i],
          windKmh: Math.round(d.windspeed_10m_max[i]),
        }))
        setDaily(days)
        const cw = data.current_weather
        setCurrent({ temp: Math.round(cw.temperature), code: cw.weathercode, windKmh: Math.round(cw.windspeed) })
      })
      .catch(() => setWeatherErr(true))
  }, [])

  if (!trip) return null
  const { basics, flights, hotel } = trip

  const today = todayStr()
  const daysLeft = daysUntil(basics.startDate)
  const tripStarted = daysLeft <= 0 && daysUntil(basics.endDate) >= 0
  const tripOver = daysUntil(basics.endDate) < 0

  const todayWeather = daily.find((d) => d.date === today)
  const tripDays = daily.filter((d) => d.date >= basics.startDate && d.date <= basics.endDate)

  const outbound = flights.find((f) => f.type === 'outbound')
  const returnFlight = flights.find((f) => f.type === 'return')

  return (
    <div className="space-y-6">

      {/* ── Hero greeting ───────────────────────────────────────────────── */}
      <div className="rounded-card border border-border bg-surface p-6 shadow-card">
        <div className="flex flex-col gap-1 tablet:flex-row tablet:items-center tablet:justify-between">
          <div>
            <p className="font-sans text-[13px] text-text-secondary">
              {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <h2 className="mt-1 font-serif text-[26px] font-semibold leading-tight text-text-primary">
              {greeting()}, Anandha Murthy {current ? weatherEmoji(current.code) : '👋'}
            </h2>
          </div>

          {/* Countdown pill */}
          <div className={[
            'mt-3 inline-flex shrink-0 flex-col items-center rounded-card px-6 py-3 tablet:mt-0',
            tripOver ? 'bg-[#F3F4F6] border border-border' :
            tripStarted ? 'bg-success/10 border border-success/30' :
            'bg-primary-light border border-primary/20',
          ].join(' ')}>
            {tripOver ? (
              <>
                <span className="font-sans text-[11px] uppercase tracking-[0.07em] text-text-secondary">Trip</span>
                <span className="font-serif text-[22px] font-semibold text-text-secondary">Done</span>
              </>
            ) : tripStarted ? (
              <>
                <span className="font-sans text-[11px] uppercase tracking-[0.07em] text-success">You're there!</span>
                <span className="font-serif text-[22px] font-semibold text-success">Enjoy 🎉</span>
              </>
            ) : (
              <>
                <span className="font-serif text-[32px] font-semibold leading-none text-primary">{daysLeft}</span>
                <span className="font-sans text-[11px] uppercase tracking-[0.07em] text-primary">
                  {daysLeft === 1 ? 'day' : 'days'} to go
                </span>
              </>
            )}
          </div>
        </div>

        {/* Trip quick-info strip */}
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-4 font-sans text-[12.5px] text-text-secondary">
          <span>📅 {formatDateSpan(basics.startDate, basics.endDate)}</span>
          <span>📍 {basics.location}</span>
          {hotel.name && <span>🏨 {hotel.name}</span>}
          {outbound && <span>✈️ Departs {fmtDate(outbound.depDateTime.slice(0, 10))} {outbound.depDateTime.slice(11, 16)}</span>}
          {returnFlight && <span>🛬 Returns {fmtDate(returnFlight.depDateTime.slice(0, 10))}</span>}
        </div>
      </div>

      {/* ── Weather block ──────────────────────────────────────────────────── */}
      <div>
        <h3 className="mb-3 font-sans text-[11.5px] font-semibold uppercase tracking-[0.07em] text-text-secondary">
          London Weather · {basics.location}
        </h3>

        {weatherErr && (
          <p className="rounded-control border border-border bg-surface px-4 py-3 font-sans text-[13px] text-text-secondary">
            Weather data unavailable — check your connection.
          </p>
        )}

        {!weatherErr && (
          <div className="space-y-4">
            {/* Today's weather */}
            {todayWeather || current ? (
              <div className={['rounded-card border p-5 shadow-card', weatherBg(current?.code ?? todayWeather?.code ?? 0)].join(' ')}>
                <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.07em] text-text-secondary">Today in London</p>
                <div className="mt-2 flex items-center gap-4">
                  <span className="text-[48px] leading-none">{weatherEmoji(current?.code ?? todayWeather?.code ?? 0)}</span>
                  <div>
                    <p className="font-serif text-[34px] font-semibold leading-none text-text-primary">
                      {current?.temp ?? todayWeather?.tempMax}°C
                    </p>
                    <p className="mt-1 font-sans text-[14px] text-text-secondary">{weatherLabel(current?.code ?? todayWeather?.code ?? 0)}</p>
                  </div>
                  {todayWeather && (
                    <div className="ml-auto space-y-1 text-right">
                      <p className="font-sans text-[12.5px] text-text-secondary">
                        <span className="font-semibold text-text-primary">{todayWeather.tempMax}°</span> / {todayWeather.tempMin}°
                      </p>
                      <p className="flex items-center justify-end gap-1 font-sans text-[12px] text-text-secondary">
                        <Droplets size={12} /> {todayWeather.precipPct}% rain
                      </p>
                      <p className="flex items-center justify-end gap-1 font-sans text-[12px] text-text-secondary">
                        <Wind size={12} /> {todayWeather.windKmh} km/h
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              !weatherErr && (
                <div className="flex items-center gap-3 rounded-card border border-border bg-surface p-5 shadow-card">
                  <Cloud size={28} className="animate-pulse text-border" />
                  <p className="font-sans text-[13px] text-text-secondary">Fetching London weather…</p>
                </div>
              )
            )}

            {/* Trip days forecast */}
            {tripDays.length > 0 && (
              <div>
                <p className="mb-2 font-sans text-[11px] font-semibold uppercase tracking-[0.07em] text-text-secondary">
                  Trip Forecast · {basics.startDate} → {basics.endDate}
                </p>
                <div className="grid grid-cols-2 gap-3 tablet:grid-cols-4 desktop:grid-cols-7">
                  {tripDays.map((d) => (
                    <div
                      key={d.date}
                      className={['rounded-control border p-3 text-center', weatherBg(d.code)].join(' ')}
                    >
                      <p className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.05em] text-text-secondary">
                        {new Date(d.date).toLocaleDateString('en-GB', { weekday: 'short' })}
                      </p>
                      <p className="font-sans text-[10px] text-text-secondary">
                        {new Date(d.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </p>
                      <p className="my-2 text-[28px] leading-none">{weatherEmoji(d.code)}</p>
                      <p className="font-sans text-[12.5px] font-semibold text-text-primary">{d.tempMax}°</p>
                      <p className="font-sans text-[11px] text-text-secondary">{d.tempMin}°</p>
                      <p className="mt-1.5 font-sans text-[10.5px] text-text-secondary">{weatherLabel(d.code)}</p>
                      {d.precipPct > 0 && (
                        <p className="mt-1 flex items-center justify-center gap-0.5 font-sans text-[10px] text-[#3B82F6]">
                          <Droplets size={9} /> {d.precipPct}%
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Days between today and trip start (preview) */}
            {tripDays.length === 0 && daily.length > 0 && daysLeft > 0 && (
              <div>
                <p className="mb-2 font-sans text-[11px] font-semibold uppercase tracking-[0.07em] text-text-secondary">
                  Next 7 Days in London
                </p>
                <div className="grid grid-cols-4 gap-3 tablet:grid-cols-7">
                  {daily.filter((d) => d.date > today).slice(0, 7).map((d) => (
                    <div key={d.date} className={['rounded-control border p-3 text-center', weatherBg(d.code)].join(' ')}>
                      <p className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.05em] text-text-secondary">
                        {new Date(d.date).toLocaleDateString('en-GB', { weekday: 'short' })}
                      </p>
                      <p className="my-2 text-[24px] leading-none">{weatherEmoji(d.code)}</p>
                      <p className="font-sans text-[12px] font-semibold text-text-primary">{d.tempMax}°</p>
                      <p className="font-sans text-[10.5px] text-text-secondary">{d.tempMin}°</p>
                      {d.precipPct > 0 && (
                        <p className="mt-1 flex items-center justify-center gap-0.5 font-sans text-[10px] text-[#3B82F6]">
                          <Droplets size={9} /> {d.precipPct}%
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Packing tip based on weather ─────────────────────────────────── */}
      {tripDays.length > 0 && (() => {
        const rainyDays = tripDays.filter((d) => d.precipPct >= 50).length
        const coldDays = tripDays.filter((d) => d.tempMin < 10).length
        const hotDays = tripDays.filter((d) => d.tempMax > 24).length
        const tips: string[] = []
        if (rainyDays > 0) tips.push(`🌂 Rain expected on ${rainyDays} day${rainyDays > 1 ? 's' : ''} — pack an umbrella`)
        if (coldDays > 0) tips.push(`🧥 Lows below 10°C on ${coldDays} day${coldDays > 1 ? 's' : ''} — bring a warm layer`)
        if (hotDays > 0) tips.push(`🌞 ${hotDays} warm day${hotDays > 1 ? 's' : ''} above 24°C — light clothing useful`)
        if (tips.length === 0) tips.push('👕 Mild conditions expected — standard London layers should do')
        return (
          <div className="rounded-card border border-border bg-note p-4 shadow-note">
            <p className="mb-2 font-sans text-[11px] font-semibold uppercase tracking-[0.07em] text-text-secondary">
              Packing weather tips
            </p>
            <ul className="space-y-1">
              {tips.map((t) => (
                <li key={t} className="font-sans text-[13px] text-text-primary">{t}</li>
              ))}
            </ul>
          </div>
        )
      })()}

      {/* ── Today's Food ──────────────────────────────────────────────────── */}
      {(() => {
        const todayMeals = trip.restaurants.days.find((d) => d.date === today)?.meals ?? []
        if (todayMeals.length === 0) return null
        return (
          <div>
            <h3 className="mb-3 font-sans text-[11.5px] font-semibold uppercase tracking-[0.07em] text-text-secondary">
              Today's Food Plan
            </h3>
            <div className="grid grid-cols-1 gap-3 tablet:grid-cols-2 desktop:grid-cols-3">
              {todayMeals.map((r) => (
                <div key={r.id} className="flex gap-3 rounded-card border border-border bg-surface p-4 shadow-card">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-light text-[18px]">
                    {r.meal === 'Breakfast' ? '🌅' : r.meal === 'Lunch' ? '☀️' : r.meal === 'Dinner' ? '🌙' : '🍵'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-secondary">{r.meal}</p>
                    <p className="font-serif text-[14px] font-semibold leading-snug text-text-primary">{r.name}</p>
                    <p className="font-sans text-[12px] text-text-secondary">{r.cuisine}</p>
                    {r.distanceKm > 0 && (
                      <p className="mt-1 font-sans text-[11.5px] text-text-secondary">📍 {r.distanceKm} km · {Math.max(5, Math.round(r.distanceKm * 12))} min walk</p>
                    )}
                    {r.hours && (
                      <p className="font-sans text-[11.5px] text-text-secondary">🕐 {r.hours}</p>
                    )}
                    {r.notes && (
                      <p className="mt-1.5 font-sans text-[11.5px] leading-relaxed text-text-secondary line-clamp-2">{r.notes}</p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-sans text-[13px] font-semibold text-text-primary">£{r.costLocal}</p>
                    <p className="font-sans text-[10.5px] text-text-secondary">per person</p>
                    {r.visited && (
                      <span className="mt-1.5 inline-block rounded-pill bg-success/10 px-2 py-0.5 font-sans text-[10px] font-semibold text-success">✓ Done</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      {/* ── Flight summary ────────────────────────────────────────────────── */}
      {(outbound || returnFlight) && (
        <div>
          <h3 className="mb-3 font-sans text-[11.5px] font-semibold uppercase tracking-[0.07em] text-text-secondary">
            Flights
          </h3>
          <div className="grid grid-cols-1 gap-3 tablet:grid-cols-2">
            {[outbound, returnFlight].filter(Boolean).map((f) => f && (
              <div key={f.id} className="flex items-center gap-4 rounded-card border border-border bg-surface p-4 shadow-card">
                <Plane size={20} className={f.type === 'return' ? 'rotate-180 text-text-secondary' : 'text-primary'} />
                <div className="flex-1 min-w-0">
                  <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.06em] text-text-secondary">
                    {f.type === 'outbound' ? 'Outbound' : 'Return'} · {f.airline} {f.flightNo}
                  </p>
                  <p className="mt-0.5 font-serif text-[15px] font-semibold text-text-primary">
                    {f.depAirport} → {f.arrAirport}
                  </p>
                  <p className="font-sans text-[12px] text-text-secondary">
                    {fmtDate(f.depDateTime.slice(0, 10))} · {f.depDateTime.slice(11, 16)} → {f.arrDateTime.slice(11, 16)}
                  </p>
                </div>
                {f.bookingRef && (
                  <div className="shrink-0 rounded-control bg-primary-light px-2.5 py-1 font-sans text-[11px] font-semibold text-primary">
                    {f.bookingRef}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
