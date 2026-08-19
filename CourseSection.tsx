import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import { useCourseSearchStore } from "./CourseSearchStore.tsx"

type Course = {
    courseName: string
    courseCode: string
    description: string
    mainCategory: string
    pricePaise: number
    priceUsdCents: number
    refundable: boolean
}

type SortOption = "featured" | "low-to-high" | "high-to-low"

export default function CourseSection(props) {
    const { accentColor = "#2447F9", cardRadius = 16 } = props

    const [courses, setCourses] = React.useState<Course[]>([])
    const [country, setCountry] = React.useState<string | null>(null)

    const [coursesLoading, setCoursesLoading] = React.useState(true)
    const [countryLoading, setCountryLoading] = React.useState(true)

    const [coursesError, setCoursesError] = React.useState(false)
    const [countryError, setCountryError] = React.useState(false)

    const [sortOption, setSortOption] = React.useState<SortOption>("featured")

    async function fetchCourses() {
        setCoursesLoading(true)
        setCoursesError(false)

        try {
            const response = await fetch(
                "https://syncsphere-hiv6.onrender.com/assignment/course-data"
            )

            if (!response.ok) {
                throw new Error("Courses request failed")
            }

            const data = await response.json()
            setCourses(data)
        } catch {
            setCoursesError(true)
        } finally {
            setCoursesLoading(false)
        }
    }

    async function fetchCountry() {
        setCountryLoading(true)
        setCountryError(false)

        try {
            const response = await fetch(
                "https://syncsphere-hiv6.onrender.com/assignment/country-code"
            )

            if (!response.ok) {
                throw new Error("Country request failed")
            }

            const data = await response.json()
            setCountry(data.country_code)
        } catch {
            setCountryError(true)
            setCountry(null)
        } finally {
            setCountryLoading(false)
        }
    }

    React.useEffect(() => {
        fetchCourses()
        fetchCountry()
    }, [])

    const [searchStore] = useCourseSearchStore()

    const filteredCourses = courses.filter((course) =>
        course.courseName
            .toLowerCase()
            .includes(searchStore.searchQuery.trim().toLowerCase())
    )

    // Derived, sorted view — never mutates `courses` or `filteredCourses`.
    // No API calls happen here; this only reorders data already in memory.
    const sortedCourses = React.useMemo(() => {
        if (sortOption === "featured") {
            // Preserve original API order exactly as returned.
            return filteredCourses
        }

        // IN uses pricePaise, US uses priceUsdCents. If country is
        // undetermined, fall back to pricePaise so sorting still runs
        // deterministically (price display already shows "unavailable"
        // in that state, this just keeps the array order stable).
        const priceKey: keyof Course =
            country === "US" ? "priceUsdCents" : "pricePaise"

        // Copy before sorting — Array.prototype.sort mutates in place,
        // and filteredCourses must stay untouched for "Featured" to work.
        const copy = [...filteredCourses]

        copy.sort((a, b) => {
            const diff = a[priceKey] - b[priceKey]
            return sortOption === "low-to-high" ? diff : -diff
        })

        return copy
    }, [filteredCourses, sortOption, country])

    // Courses are still loading
    if (coursesLoading) {
        return (
            <div style={styles.message}>
                <h3>Loading courses...</h3>
                <p>Please wait a moment.</p>
            </div>
        )
    }

    // Courses failed
    if (coursesError) {
        return (
            <div style={styles.message}>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        textAlign: "center",
                    }}
                >
                    <h3 style={{ margin: 0 }}>Couldn't load courses</h3>

                    <p style={{ margin: "10px 0 16px" }}>Please try again.</p>

                    <button onClick={fetchCourses} style={styles.button}>
                        Try again
                    </button>
                </div>
            </div>
        )
    }

    // Courses API worked but returned nothing (after search/sort applied)
    if (sortedCourses.length === 0) {
        return (
            <div style={styles.message}>
                <h3>No courses available</h3>
                <p>Check back soon for new courses.</p>
            </div>
        )
    }

    return (
        <div
            className="course-section-root"
            style={
                {
                    ...styles.container,
                    containerType: "inline-size",
                    containerName: "course-section",
                    "--card-radius": `${cardRadius}px`,
                    "--accent-color": accentColor,
                } as React.CSSProperties
            }
        >
            <style>{`
                .course-section-grid {
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                }

                @container course-section (max-width: 900px) {
                    .course-section-grid {
                        grid-template-columns: repeat(2, minmax(0, 1fr));
                    }
                }

                @container course-section (max-width: 600px) {
                    .course-section-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>

            <div style={styles.header}>
                <div>
                    <h2 style={styles.heading}>Explore courses</h2>

                    <p style={styles.subheading}>
                        Learn practical skills from courses built for real-world
                        execution.
                    </p>
                </div>

                <select
                    value={sortOption}
                    onChange={(e) =>
                        setSortOption(e.target.value as SortOption)
                    }
                    style={styles.sortSelect}
                >
                    <option value="featured">Featured</option>
                    <option value="low-to-high">Price: Low to high</option>
                    <option value="high-to-low">Price: High to low</option>
                </select>
            </div>

            {/* Country API failed */}
            {countryError && (
                <div style={styles.warning}>
                    <span>
                        Unable to determine your currency. Prices are
                        temporarily unavailable.
                    </span>

                    <button onClick={fetchCountry} style={styles.retryButton}>
                        Retry
                    </button>
                </div>
            )}

            {/* Country API is still loading */}
            {countryLoading && !countryError && (
                <div style={styles.warning}>Determining your currency...</div>
            )}

            <div className="course-section-grid" style={styles.grid}>
                {sortedCourses.map((course) => (
                    <div key={course.courseCode} style={styles.card}>
                        <div style={styles.category}>{course.mainCategory}</div>

                        <h3 style={styles.title}>{course.courseName}</h3>

                        <p style={styles.description}>{course.description}</p>

                        <div style={styles.bottom}>
                            <strong style={styles.price}>
                                {countryError || countryLoading
                                    ? "Price unavailable"
                                    : formatPrice(course, country)}
                            </strong>

                            {course.refundable && (
                                <span style={styles.badge}>✓ Refundable</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function formatPrice(course: Course, country: string | null) {
    if (country === "IN") {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2,
        }).format(course.pricePaise / 100)
    }

    if (country === "US") {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 2,
        }).format(course.priceUsdCents / 100)
    }

    return "Price unavailable"
}

const styles: Record<string, React.CSSProperties> = {
    container: {
        width: "100%",
        padding: "0",
        boxSizing: "border-box",
    },

    header: {
        marginBottom: "32px",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "16px",
        flexWrap: "wrap",
    },

    heading: {
        margin: 0,
        fontSize: "36px",
        lineHeight: 1.1,
        fontWeight: 700,
        color: "#F1F4FF",
        letterSpacing: "-0.02em",
    },

    subheading: {
        marginTop: "12px",
        marginBottom: 0,
        fontSize: "16px",
        lineHeight: 1.5,
        color: "#AAB4C7",
    },

    sortSelect: {
        padding: "10px 14px",
        borderRadius: "8px",
        border: "1px solid #34445F",
        background: "#182337",
        color: "#F1F4FF",
        fontSize: "14px",
        cursor: "pointer",
        outline: "none",
    },

    grid: {
        display: "grid",
        gap: "16px",
        width: "100%",
    },

    card: {
        width: "100%",
        minHeight: "280px",
        padding: "24px",
        boxSizing: "border-box",
        borderRadius: "var(--card-radius)",
        border: "1px solid #34445F",
        background: "#182337",
        boxShadow: "0 8px 20px rgba(0, 0, 0, 0.15)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        gap: "22px",
    },

    category: {
        fontSize: "12px",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        color: "#AAB4C7",
        marginBottom: "0",
    },

    title: {
        margin: 0,
        fontSize: "26px",
        lineHeight: 1.2,
        fontWeight: 650,
        color: "#F1F4FF",
        letterSpacing: "-0.02em",
    },

    description: {
        margin: 0,
        fontSize: "16px",
        lineHeight: 1.5,
        color: "#AAB4C7",
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
    },

    bottom: {
        marginTop: "auto",
        display: "flex",
        alignItems: "center",
        gap: "12px",
    },

    price: {
        fontSize: "24px",
        lineHeight: 1,
        fontWeight: 700,
        color: "#F1F4FF",
    },

    badge: {
        fontSize: "12px",
        fontWeight: 600,
        padding: "7px 10px",
        borderRadius: "999px",
        background: "#F1F4FF",
        color: "var(--accent-color)",
        whiteSpace: "nowrap",
    },

    warning: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px",
        padding: "12px 16px",
        marginBottom: "20px",
        borderRadius: "10px",
        background: "rgba(255, 180, 0, 0.08)",
        color: "#AAB4C7",
        fontSize: "13px",
    },

    button: {
        padding: "10px 18px",
        borderRadius: "8px",
        border: "none",
        cursor: "pointer",
        fontSize: "14px",
    },

    retryButton: {
        padding: "7px 12px",
        borderRadius: "7px",
        border: "none",
        cursor: "pointer",
        fontSize: "12px",
    },

    message: {
        width: "100%",
        height: "320px",
        display: "grid",
        placeItems: "center",
        textAlign: "center",
        boxSizing: "border-box",
        color: "#F1F4FF",
    },
}

addPropertyControls(CourseSection, {
    accentColor: {
        type: ControlType.Color,
        title: "Accent Color",
        defaultValue: "#2447F9",
    },

    cardRadius: {
        type: ControlType.Number,
        title: "Card Radius",
        defaultValue: 16,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },
})
