/* =========================================================
   CONFIGURACIÓN
========================================================= */

const START_HOUR = 7;

const END_HOUR = 24;


/*
Más compacto que la agenda administrativa.
*/

const HOUR_HEIGHT = 42;



/* =========================================================
   COLORES
========================================================= */

const EVENT_COLORS = [

    {
        background: "#E8F1FF",
        border: "#72A7F7",
        text: "#235DA8"
    },

    {
        background: "#E9F8E5",
        border: "#83CC70",
        text: "#39752B"
    },

    {
        background: "#FFF5D8",
        border: "#EEC34D",
        text: "#836311"
    },

    {
        background: "#FFE6F1",
        border: "#EA78AA",
        text: "#9A3A66"
    },

    {
        background: "#F1E9FF",
        border: "#B289EF",
        text: "#68439C"
    },

    {
        background: "#E0F6F6",
        border: "#66BEBE",
        text: "#287878"
    }

];



/* =========================================================
   DÍAS
========================================================= */

const DAYS = [

    {
        key: "lunes",
        short: "Lun"
    },

    {
        key: "martes",
        short: "Mar"
    },

    {
        key: "miercoles",
        short: "Mié"
    },

    {
        key: "jueves",
        short: "Jue"
    },

    {
        key: "viernes",
        short: "Vie"
    },

    {
        key: "sabado",
        short: "Sáb"
    },

    {
        key: "domingo",
        short: "Dom"
    }

];



/* =========================================================
   VARIABLES
========================================================= */

let events = [];

let rooms = [];

let currentWeekStart =
    getMonday(
        new Date()
    );



/* =========================================================
   BASE64URL
========================================================= */

function base64UrlDecode(value) {

    if (!value) {

        throw new Error(
            "Payload vacío"
        );

    }


    let clean =
        String(value)
            .trim()
            .replace(/\s+/g, "");


    let base64 =
        clean
            .replace(/-/g, "+")
            .replace(/_/g, "/");


    if (
        base64.length % 4 === 1
    ) {

        throw new Error(
            "Payload Base64URL inválido"
        );

    }


    while (
        base64.length % 4 !== 0
    ) {

        base64 += "=";

    }


    const binary =
        atob(
            base64
        );


    const bytes =
        Uint8Array.from(

            binary,

            char =>
                char.charCodeAt(0)

        );


    return new TextDecoder(
        "utf-8"
    ).decode(
        bytes
    );

}



/* =========================================================
   DECODIFICAR PAYLOAD
========================================================= */

function decodeCompactPayload(
    encoded
) {

    const json =
        base64UrlDecode(
            encoded
        );


    const payload =
        JSON.parse(
            json
        );


    rooms =
        payload.s || [];


    const compactEvents =
        payload.e || [];


    return compactEvents.map(
        item => {

            /*
            =================================
            EVENTO ÚNICO

            [TAG,0,DATE,START,END,ROOM]
            =================================
            */

            if (
                Number(item[1]) === 0
            ) {

                return {

                    tag:
                        item[0] || "",

                    day:
                        "",

                    date:
                        expandCompactDate(
                            item[2]
                        ),

                    start:
                        offsetToTime(
                            item[3]
                        ),

                    end:
                        offsetToTime(
                            item[4]
                        ),

                    room:
                        rooms[
                            Number(
                                item[5]
                            )
                        ] || "",

                    type:
                        "unico"

                };

            }


            /*
            =================================
            EVENTO RECURRENTE

            [TAG,DAY,START,END,ROOM]
            =================================
            */

            return {

                tag:
                    item[0] || "",

                day:
                    dayNumberToKey(
                        Number(
                            item[1]
                        )
                    ),

                date:
                    "",

                start:
                    offsetToTime(
                        item[2]
                    ),

                end:
                    offsetToTime(
                        item[3]
                    ),

                room:
                    rooms[
                        Number(
                            item[4]
                        )
                    ] || "",

                type:
                    "recurrente"

            };

        }
    );

}



/* =========================================================
   LEER URL
========================================================= */

function loadEventsFromURL() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const data =
        params.get("d");


    if (!data) {

        events =
            getDemoEvents();

        return;

    }


    try {

        events =
            decodeCompactPayload(
                data
            );

    }

    catch (error) {

        console.error(
            "Error leyendo agenda:",
            error
        );


        events =
            getDemoEvents();

    }

}



/* =========================================================
   DEMO
========================================================= */

function getDemoEvents() {

    rooms = [
        "Salón 1",
        "Salón 2",
        "Auditorio"
    ];


    return [

        {
            tag: "Piano individual",
            day: "lunes",
            date: "",
            start: "10:00",
            end: "11:00",
            room: "Salón 1",
            type: "recurrente"
        },

        {
            tag: "Ensayo",
            day: "miercoles",
            date: "",
            start: "11:30",
            end: "13:00",
            room: "Salón 2",
            type: "recurrente"
        },

        {
            tag: "Clase especial",
            day: "viernes",
            date: "",
            start: "16:00",
            end: "17:30",
            room: "Auditorio",
            type: "recurrente"
        }

    ];

}



/* =========================================================
   FECHAS
========================================================= */

function getMonday(date) {

    const result =
        new Date(
            date
        );


    result.setHours(
        12,
        0,
        0,
        0
    );


    const day =
        result.getDay();


    const difference =
        day === 0
            ? -6
            : 1 - day;


    result.setDate(
        result.getDate()
        +
        difference
    );


    return result;

}



function addDays(
    date,
    amount
) {

    const result =
        new Date(
            date
        );


    result.setDate(
        result.getDate()
        +
        amount
    );


    return result;

}



function formatISODate(date) {

    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );


    return (
        `${year}-${month}-${day}`
    );

}



function expandCompactDate(
    value
) {

    if (
        !value ||
        String(value).length !== 6
    ) {

        return "";

    }


    const text =
        String(value);


    return (
        "20"
        +
        text.slice(0,2)
        +
        "-"
        +
        text.slice(2,4)
        +
        "-"
        +
        text.slice(4,6)
    );

}



/* =========================================================
   DÍAS NUMÉRICOS
========================================================= */

function dayNumberToKey(
    number
) {

    const map = {

        1: "lunes",
        2: "martes",
        3: "miercoles",
        4: "jueves",
        5: "viernes",
        6: "sabado",
        7: "domingo"

    };


    return (
        map[number] || ""
    );

}



/* =========================================================
   HORAS
========================================================= */

function offsetToTime(
    offset
) {

    const total =
        START_HOUR * 60
        +
        Number(offset);


    const hours =
        Math.floor(
            total / 60
        );


    const minutes =
        total % 60;


    return (
        String(hours)
            .padStart(
                2,
                "0"
            )
        +
        ":"
        +
        String(minutes)
            .padStart(
                2,
                "0"
            )
    );

}



function timeToMinutes(
    value
) {

    const parts =
        String(value)
            .split(":");


    return (
        Number(parts[0]) * 60
        +
        Number(parts[1] || 0)
    );

}



/* =========================================================
   NORMALIZAR
========================================================= */

function normalizeText(
    value
) {

    return String(
        value || ""
    )
        .toLowerCase()
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .trim();

}



/* =========================================================
   EVENTOS POR FECHA
========================================================= */

function getEventsForDate(
    date,
    dayKey
) {

    const isoDate =
        formatISODate(
            date
        );


    return events.filter(
        event => {

            if (
                normalizeText(
                    event.type
                )
                ===
                "unico"
            ) {

                return (
                    event.date
                    ===
                    isoDate
                );

            }


            return (
                normalizeText(
                    event.day
                )
                ===
                normalizeText(
                    dayKey
                )
            );

        }
    );

}



/* =========================================================
   SOLAPAMIENTOS
========================================================= */

function assignOverlapPositions(
    dayEvents
) {

    const sorted =
        [...dayEvents]
        .sort(
            (a,b) =>
                timeToMinutes(a.start)
                -
                timeToMinutes(b.start)
        );


    const columns = [];


    sorted.forEach(
        event => {

            const start =
                timeToMinutes(
                    event.start
                );


            let columnIndex = 0;


            while (true) {

                if (
                    !columns[
                        columnIndex
                    ]
                ) {

                    columns[
                        columnIndex
                    ] = [];

                    break;

                }


                const last =
                    columns[
                        columnIndex
                    ][
                        columns[
                            columnIndex
                        ].length - 1
                    ];


                if (
                    start
                    >=
                    timeToMinutes(
                        last.end
                    )
                ) {

                    break;

                }


                columnIndex++;

            }


            columns[
                columnIndex
            ].push(
                event
            );


            event._column =
                columnIndex;

        }
    );


    sorted.forEach(
        event => {

            event._columns =
                columns.length || 1;

        }
    );


    return sorted;

}



/* =========================================================
   COLOR POR SALÓN
========================================================= */

function getRoomColor(
    room
) {

    const index =
        Math.max(
            0,
            rooms.indexOf(
                room
            )
        );


    return (
        EVENT_COLORS[
            index
            %
            EVENT_COLORS.length
        ]
    );

}



/* =========================================================
   RENDER
========================================================= */

function renderCalendar() {

    const calendar =
        document.getElementById(
            "calendar"
        );


    calendar.innerHTML =
        "";


    const today =
        new Date();


    const todayISO =
        formatISODate(
            today
        );


    const totalHours =
        END_HOUR
        -
        START_HOUR;


    const bodyHeight =
        totalHours
        *
        HOUR_HEIGHT;



    /*
    =================================
    CABECERA
    =================================
    */

    const header =
        document.createElement(
            "div"
        );


    header.className =
        "day-header-row";


    const corner =
        document.createElement(
            "div"
        );


    corner.className =
        "time-corner";


    header.appendChild(
        corner
    );


    DAYS.forEach(
        (day,index) => {

            const date =
                addDays(
                    currentWeekStart,
                    index
                );


            const element =
                document.createElement(
                    "div"
                );


            element.className =
                "day-header";


            if (
                formatISODate(date)
                ===
                todayISO
            ) {

                element.classList.add(
                    "today"
                );

            }


            element.innerHTML = `

                <div class="day-name">
                    ${day.short}
                </div>

                <div class="day-number">
                    ${date.getDate()}
                </div>

            `;


            header.appendChild(
                element
            );

        }
    );


    calendar.appendChild(
        header
    );



    /*
    =================================
    CUERPO
    =================================
    */

    const body =
        document.createElement(
            "div"
        );


    body.className =
        "calendar-body";


    body.style.height =
        `${bodyHeight}px`;



    /*
    COLUMNA HORAS
    */

    const timeColumn =
        document.createElement(
            "div"
        );


    timeColumn.className =
        "time-column";


    createTimeLines(
        timeColumn
    );


    body.appendChild(
        timeColumn
    );



    /*
    DÍAS
    */

    DAYS.forEach(
        (day,index) => {

            const date =
                addDays(
                    currentWeekStart,
                    index
                );


            const column =
                document.createElement(
                    "div"
                );


            column.className =
                "day-column";


            createBackgroundLines(
                column
            );


            const dayEvents =
                assignOverlapPositions(

                    getEventsForDate(
                        date,
                        day.key
                    )

                );


            dayEvents.forEach(
                event => {

                    createEvent(
                        event,
                        column,
                        date
                    );

                }
            );


            /*
            Línea hora actual
            */

            if (
                formatISODate(date)
                ===
                todayISO
            ) {

                createCurrentTimeLine(
                    column
                );

            }


            body.appendChild(
                column
            );

        }
    );


    calendar.appendChild(
        body
    );


    updateWeekTitle();

}



/* =========================================================
   LÍNEAS HORAS
========================================================= */

function createTimeLines(
    container
) {

    const totalHours =
        END_HOUR
        -
        START_HOUR;


    for (
        let i = 0;
        i <= totalHours;
        i++
    ) {

        const top =
            i
            *
            HOUR_HEIGHT;


        const line =
            document.createElement(
                "div"
            );


        line.className =
            "hour-line";


        line.style.top =
            `${top}px`;


        container.appendChild(
            line
        );


        const label =
            document.createElement(
                "div"
            );


        label.className =
            "hour-label";


        if (
            i === 0
        ) {

            label.classList.add(
                "first-hour"
            );

        }


        if (
            i === totalHours
        ) {

            label.classList.add(
                "last-hour"
            );

        }


        label.style.top =
            `${top}px`;


        label.textContent =
            String(
                START_HOUR + i
            ).padStart(
                2,
                "0"
            )
            +
            ":00";


        container.appendChild(
            label
        );


        if (
            i < totalHours
        ) {

            const half =
                document.createElement(
                    "div"
                );


            half.className =
                "half-hour-line";


            half.style.top =
                `${
                    top
                    +
                    HOUR_HEIGHT / 2
                }px`;


            container.appendChild(
                half
            );

        }

    }

}



function createBackgroundLines(
    container
) {

    const totalHours =
        END_HOUR
        -
        START_HOUR;


    for (
        let i = 0;
        i <= totalHours;
        i++
    ) {

        const top =
            i
            *
            HOUR_HEIGHT;


        const line =
            document.createElement(
                "div"
            );


        line.className =
            "hour-line";


        line.style.top =
            `${top}px`;


        container.appendChild(
            line
        );


        if (
            i < totalHours
        ) {

            const half =
                document.createElement(
                    "div"
                );


            half.className =
                "half-hour-line";


            half.style.top =
                `${
                    top
                    +
                    HOUR_HEIGHT / 2
                }px`;


            container.appendChild(
                half
            );

        }

    }

}



/* =========================================================
   EVENTO
========================================================= */

function createEvent(
    event,
    container,
    date
) {

    const start =
        timeToMinutes(
            event.start
        );


    const end =
        timeToMinutes(
            event.end
        );


    const calendarStart =
        START_HOUR
        *
        60;


    if (
        end <= calendarStart
        ||
        start >= END_HOUR * 60
    ) {

        return;

    }


    const top =
        (
            start
            -
            calendarStart
        )
        /
        60
        *
        HOUR_HEIGHT;


    const height =
        (
            end
            -
            start
        )
        /
        60
        *
        HOUR_HEIGHT;


    const element =
        document.createElement(
            "div"
        );


    element.className =
        "event";


    const color =
        getRoomColor(
            event.room
        );


    element.style.background =
        color.background;


    element.style.borderColor =
        color.border;


    element.style.color =
        color.text;


    element.style.top =
        `${top + 2}px`;


    element.style.height =
        `${
            Math.max(
                24,
                height - 4
            )
        }px`;


    const columns =
        event._columns || 1;


    const column =
        event._column || 0;


    const width =
        100
        /
        columns;


    element.style.left =
        `calc(${column * width}% + 2px)`;


    element.style.width =
        `calc(${width}% - 4px)`;


    element.innerHTML = `

        <div class="event-tag">
            ${escapeHTML(
                event.tag
            )}
        </div>

        <div class="event-room">
            ${escapeHTML(
                event.room
            )}
        </div>

    `;


    element.addEventListener(
        "click",
        () => {

            openPopup(
                event,
                date
            );

        }
    );


    container.appendChild(
        element
    );

}



/* =========================================================
   HORA ACTUAL
========================================================= */

function createCurrentTimeLine(
    container
) {

    const now =
        new Date();


    const minutes =
        now.getHours() * 60
        +
        now.getMinutes();


    const start =
        START_HOUR * 60;


    const end =
        END_HOUR * 60;


    if (
        minutes < start
        ||
        minutes > end
    ) {

        return;

    }


    const top =
        (
            minutes - start
        )
        /
        60
        *
        HOUR_HEIGHT;


    const line =
        document.createElement(
            "div"
        );


    line.className =
        "current-time-line";


    line.style.top =
        `${top}px`;


    const dot =
        document.createElement(
            "div"
        );


    dot.className =
        "current-time-dot";


    line.appendChild(
        dot
    );


    container.appendChild(
        line
    );

}



/* =========================================================
   TÍTULO
========================================================= */

function updateWeekTitle() {

    const middle =
        addDays(
            currentWeekStart,
            3
        );


    document.getElementById(
        "monthTitle"
    ).textContent =
        middle
            .toLocaleDateString(
                "es-MX",
                {
                    month: "short"
                }
            )
            .replace(".", "")
            .toUpperCase();


    const end =
        addDays(
            currentWeekStart,
            6
        );


    document.getElementById(
        "weekSubtitle"
    ).textContent =
        `${
            currentWeekStart.getDate()
        } – ${
            end.getDate()
        }`;

}



/* =========================================================
   POPUP
========================================================= */

function openPopup(
    event,
    date
) {

    document.getElementById(
        "popupTag"
    ).textContent =
        event.tag;


    document.getElementById(
        "popupRoom"
    ).textContent =
        event.room || "—";


    document.getElementById(
        "popupDate"
    ).textContent =
        date.toLocaleDateString(
            "es-MX",
            {
                weekday: "long",
                day: "numeric",
                month: "long"
            }
        );


    document.getElementById(
        "popupTime"
    ).textContent =
        `${event.start} – ${event.end}`;


    document.getElementById(
        "eventOverlay"
    ).classList.add(
        "visible"
    );

}



function closePopup() {

    document.getElementById(
        "eventOverlay"
    ).classList.remove(
        "visible"
    );

}



/* =========================================================
   ESCAPE
========================================================= */

function escapeHTML(
    value
) {

    return String(
        value || ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}



/* =========================================================
   BOTONES
========================================================= */

document.getElementById(
    "prevWeek"
).addEventListener(
    "click",
    () => {

        currentWeekStart =
            addDays(
                currentWeekStart,
                -7
            );


        renderCalendar();

    }
);



document.getElementById(
    "nextWeek"
).addEventListener(
    "click",
    () => {

        currentWeekStart =
            addDays(
                currentWeekStart,
                7
            );


        renderCalendar();

    }
);



document.getElementById(
    "todayButton"
).addEventListener(
    "click",
    () => {

        currentWeekStart =
            getMonday(
                new Date()
            );


        renderCalendar();

    }
);



document.getElementById(
    "closePopup"
).addEventListener(
    "click",
    closePopup
);



document.getElementById(
    "eventOverlay"
).addEventListener(
    "click",
    event => {

        if (
            event.target.id
            ===
            "eventOverlay"
        ) {

            closePopup();

        }

    }
);



/* =========================================================
   INICIO
========================================================= */

loadEventsFromURL();

renderCalendar();
