(function (global) {
    const React = global.React;
    if (!React) return;

    const { useEffect, useMemo, useState } = React;

    const WEATHER_ICON = {
        0: "☀️",
        1: "🌤️",
        2: "⛅",
        3: "☁️",
        45: "🌫️",
        48: "🌫️",
        51: "🌦️",
        53: "🌦️",
        55: "🌦️",
        56: "🌧️",
        57: "🌧️",
        61: "🌧️",
        63: "🌧️",
        65: "🌧️",
        66: "🌧️",
        67: "🌧️",
        71: "🌨️",
        73: "🌨️",
        75: "🌨️",
        77: "🌨️",
        80: "🌦️",
        81: "🌦️",
        82: "🌧️",
        85: "🌨️",
        86: "🌨️",
        95: "⛈️",
        96: "⛈️",
        99: "⛈️"
    };

    function toIsoDate(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        return y + "-" + m + "-" + d;
    }

    function dateWithOffset(offset) {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + offset);
        return toIsoDate(d);
    }

    function toMMDD(isoDate) {
        if (!isoDate) return "--/--";
        const p = isoDate.split("-");
        if (p.length !== 3) return "--/--";
        return p[1] + "/" + p[2];
    }

    function getWeekdayInfo(isoDate) {
        if (!isoDate || isoDate === "--/--") return { text: "--", isWeekend: false, isToday: false };
        const p = isoDate.split("-");
        if (p.length !== 3) return { text: "--", isWeekend: false, isToday: false };
        const d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
        const week = ["日", "一", "二", "三", "四", "五", "六"];
        const w = d.getDay();
        if (Number.isNaN(w)) return { text: "--", isWeekend: false, isToday: false };
        return { text: week[w], isWeekend: w === 0 || w === 6, isToday: isoDate === dateWithOffset(0) };
    }

    async function fetchForecast(lat, lon) {
        const qs = new URLSearchParams({
            latitude: String(lat),
            longitude: String(lon),
            daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
            forecast_days: "16",
            timezone: "auto"
        });
        const res = await fetch("https://api.open-meteo.com/v1/forecast?" + qs.toString());
        if (!res.ok) throw new Error("weather-request-failed");
        const data = await res.json();
        if (!data || !data.daily || !Array.isArray(data.daily.time)) throw new Error("weather-invalid-payload");
        return data.daily;
    }

    function WeatherStrip(props) {
        const days = Array.isArray(props && props.days) ? props.days : [];
        const [cards, setCards] = useState([]);
        const [state, setState] = useState("loading");

        const normalizedDays = useMemo(function () {
            return days.map(function (day, idx) {
                return Object.assign(
                    {
                        label: "DAY " + (idx + 1),
                        color: "#2dd4bf"
                    },
                    day || {}
                );
            });
        }, [days]);

        const effectiveDays = useMemo(function () {
            if (!normalizedDays.length) return [];
            const hasFixedDate = normalizedDays.some(function (day) { return !!day.date; });
            if (hasFixedDate) {
                return normalizedDays.map(function (day, idx) {
                    return Object.assign({}, day, { offset: idx });
                });
            }
            const base = normalizedDays[0];
            return Array.from({ length: 7 }, function (_, idx) {
                return Object.assign({}, base, {
                    label: "DAY " + (idx + 1),
                    offset: idx
                });
            });
        }, [normalizedDays]);

        useEffect(function () {
            let cancelled = false;

            async function loadWeather() {
                if (!effectiveDays.length) {
                    if (!cancelled) {
                        setCards([]);
                        setState("error");
                    }
                    return;
                }

                try {
                    setState("loading");
                    const uniquePoints = [];
                    const pointSeen = new Set();
                    effectiveDays.forEach(function (day) {
                        const key = String(day.lat) + "," + String(day.lon);
                        if (!pointSeen.has(key)) {
                            pointSeen.add(key);
                            uniquePoints.push({ key: key, lat: day.lat, lon: day.lon });
                        }
                    });

                    const forecasts = await Promise.all(
                        uniquePoints.map(async function (p) {
                            const daily = await fetchForecast(p.lat, p.lon);
                            return [p.key, daily];
                        })
                    );
                    const byPoint = Object.fromEntries(forecasts);

                    const nextCards = effectiveDays.map(function (day, idx) {
                        const key = String(day.lat) + "," + String(day.lon);
                        const daily = byPoint[key];
                        if (!daily) throw new Error("weather-missing-point");

                        const targetOffset = typeof day.offset === "number" ? day.offset : idx;
                        const targetDate = day.date || dateWithOffset(targetOffset);
                        let hit = daily.time.indexOf(targetDate);
                        if (hit === -1 && !day.date && targetOffset < daily.time.length) {
                            hit = targetOffset;
                        }
                        if (hit === -1) throw new Error("weather-date-out-of-range");

                        const code = Number(daily.weather_code[hit]);
                        return {
                            label: day.label,
                            color: day.color || "#2dd4bf",
                            place: day.place || "",
                            date: daily.time[hit] || targetDate,
                            icon: WEATHER_ICON[code] || "🌤️",
                            high: Math.round(Number(daily.temperature_2m_max[hit])),
                            low: Math.round(Number(daily.temperature_2m_min[hit])),
                            rain: Math.round(Number(daily.precipitation_probability_max[hit]))
                        };
                    });

                    if (!cancelled) {
                        setCards(nextCards);
                        setState("ready");
                    }
                } catch (err) {
                    if (!cancelled) {
                        setCards([]);
                        setState("error");
                    }
                }
            }

            loadWeather();
            return function () {
                cancelled = true;
            };
        }, [effectiveDays]);

        if (!effectiveDays.length) return null;

        const wrapStyle = {
            maxWidth: 1000,
            margin: "0 auto",
            padding: "0.9rem 12px 1rem"
        };

        if (state === "error") {
            return React.createElement(
                "div",
                { style: wrapStyle },
                React.createElement(
                    "div",
                    {
                        style: {
                            borderRadius: 12,
                            border: "1px solid rgba(255,255,255,0.08)",
                            background: "rgba(255,255,255,0.04)",
                            color: "rgba(255,255,255,0.55)",
                            fontSize: "0.88rem",
                            textAlign: "center",
                            padding: "0.9rem 1rem"
                        }
                    },
                    "無法取得天氣 · 出發前請再確認"
                )
            );
        }

        const content = state === "ready" ? cards : effectiveDays.map(function (d) {
            return { label: d.label, color: d.color, place: d.place || "", date: "--/--", icon: "⏳", high: "--", low: "--", rain: "--" };
        });

        return React.createElement(
            "div",
            { style: wrapStyle },
            React.createElement(
                "div",
                {
                    style: {
                        display: "flex",
                        gap: "0.65rem",
                        overflowX: "auto",
                        paddingBottom: "0.2rem"
                    }
                },
                content.map(function (c, idx) {
                    const weekdayInfo = getWeekdayInfo(c.date);
                    const weekdayStyle = weekdayInfo.isWeekend
                        ? {
                            color: "#ffffff",
                            background: "#dc2626",
                            border: "1px solid #ef4444",
                            boxShadow: "0 4px 12px rgba(220,38,38,0.35)"
                        }
                        : {
                            color: c.color || "#2dd4bf",
                            background: (c.color || "#2dd4bf") + "1f",
                            border: "1px solid " + (c.color || "#2dd4bf") + "40",
                            boxShadow: "none"
                        };

                    return React.createElement(
                        "div",
                        {
                            key: "weather-card-" + idx,
                            style: {
                                flex: "1 1 0",
                                minWidth: 148,
                                minHeight: 108,
                                borderRadius: 12,
                                background: "rgba(255,255,255,0.04)",
                                border: "1px solid rgba(255,255,255,0.08)",
                                padding: "0.7rem 0.75rem",
                                boxShadow: "0 8px 20px rgba(0,0,0,0.22)",
                                overflow: "hidden"
                            }
                        },
                        React.createElement(
                            "div",
                            { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 } },
                            React.createElement(
                                "span",
                                {
                                    style: {
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        minWidth: 48,
                                        padding: "3px 10px",
                                        borderRadius: 999,
                                        fontSize: "0.74rem",
                                        fontWeight: 700,
                                        letterSpacing: 0.6,
                                        transition: "all 0.2s",
                                        color: weekdayStyle.color,
                                        background: weekdayStyle.background,
                                        border: weekdayStyle.border,
                                        boxShadow: weekdayStyle.boxShadow
                                    }
                                },
                                weekdayInfo.isToday ? "今天" : ("週" + weekdayInfo.text)
                            ),
                            React.createElement("span", { style: { fontSize: "0.8rem", color: "#e2e8f0", fontWeight: 600, letterSpacing: 0.3, minWidth: 44, textAlign: "right", fontVariantNumeric: "tabular-nums" } }, toMMDD(c.date))
                        ),
                        React.createElement("div", { style: { fontSize: "0.74rem", color: "rgba(255,255,255,0.78)", marginBottom: 6, lineHeight: 1.3, minHeight: 19, overflowWrap: "anywhere" } }, "📍 ", c.place || "未指定地點"),
                        React.createElement(
                            "div",
                            { style: { display: "flex", alignItems: "center", gap: 8, minWidth: 0 } },
                            React.createElement("span", { style: { fontSize: "1.4rem", lineHeight: 1, flexShrink: 0 } }, c.icon),
                            React.createElement(
                                "div",
                                { style: { minWidth: 0 } },
                                React.createElement(
                                    "div",
                                    { style: { display: "flex", gap: 6, alignItems: "baseline", flexWrap: "wrap", fontSize: "0.8rem", fontWeight: 700, color: "#ffffff", lineHeight: 1.2, fontVariantNumeric: "tabular-nums" } },
                                    React.createElement("span", null, "↑", c.high, "°C"),
                                    React.createElement("span", null, "↓", c.low, "°C")
                                ),
                                React.createElement("div", { style: { fontSize: "0.76rem", color: "rgba(255,255,255,0.74)", marginTop: 2, lineHeight: 1.2, fontVariantNumeric: "tabular-nums" } }, "💧 ", c.rain, "%")
                            )
                        )
                    );
                })
            )
        );
    }

    global.WeatherStrip = WeatherStrip;
})(window);
