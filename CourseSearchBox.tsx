import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import { useCourseSearchStore } from "./CourseSearchStore.tsx"

export default function CourseSearchBox(props) {
    const { placeholder = "Search Courses", accentColor = "#2447F9" } = props
    const [store, setStore] = useCourseSearchStore()

    return (
        <input
            type="text"
            value={store.searchQuery}
            onChange={(e) => setStore({ searchQuery: e.target.value })}
            placeholder={placeholder}
            style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "14px 18px",
                borderRadius: "10px",
                border: "1px solid #34445F",
                background: "#182337",
                color: "#F1F4FF",
                fontSize: "16px",
                outline: "none",
            }}
            onFocus={(e) =>
                (e.target.style.border = `1px solid ${accentColor}`)
            }
            onBlur={(e) => (e.target.style.border = "1px solid #34445F")}
        />
    )
}

addPropertyControls(CourseSearchBox, {
    placeholder: {
        type: ControlType.String,
        title: "Placeholder",
        defaultValue: "Search Courses",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent Color",
        defaultValue: "#2447F9",
    },
})
