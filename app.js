/* =========================================================
   CONFIGURACIÓN GENERAL
========================================================= */

const START_HOUR = 7;
const END_HOUR = 24;

/*
Cada hora ocupará 70px verticalmente.

Por ejemplo:

07:00 → 0px
08:00 → 70px
08:30 → 105px
09:00 → 140px

Esto permite colocar las clases exactamente
de acuerdo con su hora.
*/

const HOUR_HEIGHT = 45;

const TIME_COLUMN_WIDTH = 65;


/* =========================================================
   PALETA DE COLORES PARA MAESTROS
========================================================= */

const TEACHER_COLORS = [

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
        background: "#FFE9D6",
        border: "#EEA45B",
        text: "#98591C"
    },

    {
        background: "#E0F6F6",
        border: "#66BEBE",
        text: "#287878"
    },

    {
        background: "#FDE9E9",
        border: "#E78686",
        text: "#923B3B"
    },

    {
        background: "#E9EEF8",
        border: "#8FA4D2",
        text: "#455A89"
    },

    {
        background: "#F3F3D7",
        border: "#B8B85E",
        text: "#69691E"
    }

];


/* =========================================================
   DÍAS
========================================================= */

const DAYS = [

    {
        key: "lunes",
        label: "Lunes"
    },

    {
        key: "martes",
        label: "Martes"
    },

    {
        key: "miercoles",
        label: "Miércoles"
    },

    {
        key: "jueves",
        label: "Jueves"
    },

    {
        key: "viernes",
        label: "Viernes"
    },

    {
        key: "sabado",
        label: "Sábado"
    },

    {
        key: "domingo",
        label: "Domingo"
    }

];


/* =========================================================
   VARIABLES PRINCIPALES
========================================================= */

let events = [];

let currentWeekStart = getMonday(new Date());

let showSunday = false;

let teacherColorMap = {};

/*
Maestro actualmente seleccionado
desde la leyenda.
*/

let activeTeacher = null;

let selectedRooms = new Set();


function renderRoomFilters() {

    const container =
        document.getElementById(
            "roomFilters"
        );


    container.innerHTML = "";


    /*
    Solo obtenemos salones que realmente
    aparecen en los eventos actuales.
    */

    const rooms = [

        ...new Set(

            events
                .map(event => event.room)
                .filter(Boolean)

        )

    ].sort();


    rooms.forEach(room => {

        const button =
            document.createElement(
                "button"
            );


        button.className =
            "room-filter-button";


        button.textContent =
            room;


        button.dataset.room =
            room;


        if (
            selectedRooms.has(room)
        ) {

            button.classList.add(
                "active"
            );

        }


        button.addEventListener(
            "click",
            () => {

                toggleRoomFilter(
                    room
                );

            }
        );


        container.appendChild(
            button
        );

    });

}

function toggleRoomFilter(room) {

    /*
    Si ya está seleccionado,
    lo quitamos.
    */

    if (
        selectedRooms.has(room)
    ) {

        selectedRooms.delete(room);

    }

    else {

        selectedRooms.add(room);

    }


    /*
    IMPORTANTE:
    reconstruimos el calendario completo.

    Así los eventos restantes recalculan
    sus columnas y ocupan todo el espacio.
    */

    renderCalendar();

}



function base64UrlDecode(value) {


    /*
    Base64URL:
    - convierte - en +
    - convierte _ en /
    - recupera padding =
    */

    let base64 =
        value
            .replace(/-/g, "+")
            .replace(/_/g, "/");


    while (
        base64.length % 4
    ) {

        base64 += "=";

    }


    const binary =
        atob(base64);


    const bytes =
        Uint8Array.from(
            binary,
            char =>
                char.charCodeAt(0)
        );


    return new TextDecoder()
        .decode(bytes);

}

function decodeCompactPayload(encoded) {

    const json =
        base64UrlDecode(
            encoded
        );


    const payload =
        JSON.parse(
            json
        );


    const teachers =
        payload.m || [];


    const rooms =
        payload.s || [];


    const compactEvents =
        payload.e || [];


    return compactEvents.map(
        item => {

            const tag =
                item[0] || "";

            const dayNumber =
                Number(
                    item[1] || 0
                );

            const compactDate =
                item[2] || "";

            const startOffset =
                Number(
                    item[3] || 0
                );

            const endOffset =
                Number(
                    item[4] || 0
                );

            const roomIndex =
                Number(
                    item[5] || 0
                );

            const teacherIndex =
                Number(
                    item[6] || 0
                );


            const isUnique =
                dayNumber === 0;


            return {

                tag: tag,

                day:
                    isUnique
                        ? ""
                        : dayNumberToKey(
                            dayNumber
                        ),

                date:
                    isUnique
                        ? expandCompactDate(
                            compactDate
                        )
                        : "",

                start:
                    offsetToTime(
                        startOffset
                    ),

                end:
                    offsetToTime(
                        endOffset
                    ),

                room:
                    rooms[
                        roomIndex
                    ] || "",

                teacher:
                    teachers[
                        teacherIndex
                    ] || "",

                type:
                    isUnique
                        ? "unico"
                        : "recurrente"

            };

        }
    );

}

function dayNumberToKey(number) {

    const map = {

        1: "lunes",
        2: "martes",
        3: "miercoles",
        4: "jueves",
        5: "viernes",
        6: "sabado",
        7: "domingo"

    };


    return map[number] || "";

}

function expandCompactDate(value) {

    if (
        !value ||
        String(value).length !== 6
    ) {

        return "";

    }


    const text =
        String(value);


    const year =
        "20" +
        text.slice(0, 2);


    const month =
        text.slice(2, 4);


    const day =
        text.slice(4, 6);


    return `${year}-${month}-${day}`;

}

function offsetToTime(offset) {

    const totalMinutes =
        START_HOUR * 60
        +
        Number(offset);


    const hours =
        Math.floor(
            totalMinutes / 60
        );


    const minutes =
        totalMinutes % 60;


    return (
        String(hours)
            .padStart(2, "0")
        +
        ":"
        +
        String(minutes)
            .padStart(2, "0")
    );

}

/* =========================================================
   LEER DATOS DESDE URL
========================================================= */

function loadEventsFromURL() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const compactParam =
        params.get("d");

    const legacyParam =
        params.get("events");


    /*
    =====================================
    NUEVO FORMATO COMPACTO
    =====================================
    */

    if (compactParam) {

        try {

            events =
                decodeCompactPayload(
                    compactParam
                );

            console.log(
                "Eventos cargados desde formato compacto:",
                events
            );

            return;

        }

        catch (error) {

            console.error(
                "Error leyendo payload compacto:",
                error
            );

        }

    }


    /*
    =====================================
    FORMATO ANTIGUO
    =====================================
    */

    if (legacyParam) {

        try {

            events =
                JSON.parse(
                    legacyParam
                );

            console.log(
                "Eventos cargados desde formato antiguo:",
                events
            );

            return;

        }

        catch (error) {

            console.error(
                "Error leyendo formato antiguo:",
                error
            );

        }

    }


    /*
    =====================================
    DEMO
    =====================================
    */

    console.warn(
        "No se encontraron datos válidos. Se cargarán eventos demo."
    );

    events =
        getDemoEvents();

}


/* =========================================================
   EVENTOS DEMO
========================================================= */

function getDemoEvents() {

    return [

        {
            tag: "Piano Individual",
            day: "lunes",
            date: "",
            start: "08:00",
            end: "09:00",
            room: "Salón 1",
            teacher: "Osbaldo Guerrero",
            type: "recurrente"
        },

        {
            tag: "Piano Individual",
            day: "lunes",
            date: "",
            start: "08:30",
            end: "09:30",
            room: "Salón 2",
            teacher: "María Fernanda",
            type: "recurrente"
        },

        {
            tag: "Violín",
            day: "martes",
            date: "",
            start: "09:00",
            end: "10:30",
            room: "Salón 3",
            teacher: "Manuel Muñoz",
            type: "recurrente"
        },

        {
            tag: "Teoría Musical",
            day: "miercoles",
            date: "",
            start: "14:00",
            end: "15:00",
            room: "Salón 1",
            teacher: "Carlos Mendoza",
            type: "recurrente"
        },

        {
            tag: "Canto",
            day: "viernes",
            date: "",
            start: "18:30",
            end: "19:30",
            room: "Salón 4",
            teacher: "Joanna Quintana",
            type: "recurrente"
        },

        {
            tag: "Clase de recuperación",
            day: "",
            date: "2026-08-13",
            start: "16:00",
            end: "17:30",
            room: "Salón 2",
            teacher: "Manuel Muñoz",
            type: "unico"
        }

    ];

}



/* =========================================================
   UTILIDADES DE FECHA
========================================================= */

function getMonday(date) {

    const result = new Date(date);

    result.setHours(12, 0, 0, 0);

    const day = result.getDay();

    const difference =
        day === 0
            ? -6
            : 1 - day;

    result.setDate(
        result.getDate() + difference
    );

    return result;

}


function addDays(date, amount) {

    const result = new Date(date);

    result.setDate(
        result.getDate() + amount
    );

    return result;

}


function formatISODate(date) {

    const year = date.getFullYear();

    const month =
        String(date.getMonth() + 1)
        .padStart(2, "0");

    const day =
        String(date.getDate())
        .padStart(2, "0");

    return `${year}-${month}-${day}`;

}


function formatDayMonth(date) {

    return date.toLocaleDateString(
        "es-MX",
        {
            day: "numeric",
            month: "short"
        }
    );

}


function formatLongDate(date) {

    return date.toLocaleDateString(
        "es-MX",
        {
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    );

}



/* =========================================================
   NORMALIZAR TEXTO
========================================================= */

function normalizeText(text) {

    return String(text || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();

}



/* =========================================================
   CONVERTIR HORA A MINUTOS
========================================================= */

function timeToMinutes(time) {

    if (!time) {
        return 0;
    }

    const parts = time.split(":");

    const hours = Number(parts[0]);

    const minutes = Number(parts[1] || 0);

    return hours * 60 + minutes;

}



/* =========================================================
   COLORES POR MAESTRO
========================================================= */

function createTeacherColorMap() {

    teacherColorMap = {};

    const teachers = [

        ...new Set(

            events
                .map(event => event.teacher)
                .filter(Boolean)

        )

    ].sort();


    teachers.forEach(
        (teacher, index) => {

            teacherColorMap[teacher] =
                TEACHER_COLORS[
                    index % TEACHER_COLORS.length
                ];

        }
    );

}


function getTeacherColor(teacher) {

    if (
        teacherColorMap[teacher]
    ) {

        return teacherColorMap[teacher];

    }


    return {

        background: "#ECEFF3",
        border: "#ADB5BD",
        text: "#495057"

    };

}



/* =========================================================
   EVENTOS DE UN DÍA
========================================================= */

function getEventsForDate(date, dayKey) {

    const isoDate =
        formatISODate(date);


    return events.filter(event => {

        /*
        =================================
        FILTRO POR SALÓN
        =================================
        */

        if (
            selectedRooms.size > 0 &&
            !selectedRooms.has(
                event.room
            )
        ) {

            return false;

        }


        const type =
            normalizeText(
                event.type
            );


        /*
        =================================
        EVENTO ÚNICO
        =================================
        */

        if (
            type === "unico" ||
            type === "único"
        ) {

            return (
                event.date
                ===
                isoDate
            );

        }


        /*
        =================================
        EVENTO RECURRENTE
        =================================
        */

        return (
            normalizeText(
                event.day
            )
            ===
            normalizeText(
                dayKey
            )
        );

    });

}


/* =========================================================
   DETECTAR EVENTOS QUE SE ENCIMAN
========================================================= */

function assignOverlapPositions(dayEvents) {

    /*
    Ordenamos primero por hora de inicio,
    después por hora final.
    */

    const sorted = [...dayEvents].sort(
        (a, b) => {

            const startDifference =
                timeToMinutes(a.start)
                -
                timeToMinutes(b.start);

            if (startDifference !== 0) {

                return startDifference;

            }

            return (
                timeToMinutes(a.end)
                -
                timeToMinutes(b.end)
            );

        }
    );


    const groups = [];

    let currentGroup = [];

    let currentGroupEnd = -1;


    sorted.forEach(event => {

        const start =
            timeToMinutes(event.start);

        const end =
            timeToMinutes(event.end);


        if (
            currentGroup.length === 0 ||
            start < currentGroupEnd
        ) {

            currentGroup.push(event);

            currentGroupEnd =
                Math.max(
                    currentGroupEnd,
                    end
                );

        }

        else {

            groups.push(currentGroup);

            currentGroup = [event];

            currentGroupEnd = end;

        }

    });


    if (currentGroup.length) {

        groups.push(currentGroup);

    }


    /*
    Dentro de cada grupo asignamos columnas.
    */

    groups.forEach(group => {

        const columns = [];


        group.forEach(event => {

            const start =
                timeToMinutes(event.start);


            let columnIndex = 0;


            while (true) {

                if (!columns[columnIndex]) {

                    columns[columnIndex] = [];

                    break;

                }


                const lastEvent =
                    columns[columnIndex][
                        columns[columnIndex].length - 1
                    ];


                const lastEnd =
                    timeToMinutes(
                        lastEvent.end
                    );


                if (start >= lastEnd) {

                    break;

                }


                columnIndex++;

            }


            columns[columnIndex].push(event);

            event._column = columnIndex;

        });


        group.forEach(event => {

            event._columns =
                columns.length;

        });

    });


    return sorted;

}



/* =========================================================
   CONSTRUIR CALENDARIO
========================================================= */

function renderCalendar() {

    const calendar =
        document.getElementById(
            "calendar"
        );


    calendar.innerHTML = "";


    const numberOfDays =
        showSunday ? 7 : 6;


    const visibleDays =
        DAYS.slice(
            0,
            numberOfDays
        );


    /*
    ALTURA TOTAL

    24 - 7 = 17 horas
    */

    const totalHours =
        END_HOUR - START_HOUR;

    const bodyHeight =
        totalHours * HOUR_HEIGHT;


    /*
    CABECERA
    */

    const headerRow =
        document.createElement("div");


    headerRow.className =
        "day-header-row";


    headerRow.style.gridTemplateColumns =
        `${TIME_COLUMN_WIDTH}px repeat(${numberOfDays}, 1fr)`;


    /*
    Esquina de hora
    */

    const timeHeader =
        document.createElement("div");

    timeHeader.className =
        "time-header";

    timeHeader.textContent =
        "Hora";

    headerRow.appendChild(
        timeHeader
    );


    /*
    Día actual
    */

    const todayISO =
        formatISODate(new Date());


    visibleDays.forEach(
        (day, index) => {

            const date =
                addDays(
                    currentWeekStart,
                    index
                );


            const header =
                document.createElement(
                    "div"
                );


            header.className =
                "day-header";


            if (
                formatISODate(date)
                ===
                todayISO
            ) {

                header.classList.add(
                    "today"
                );

            }


            header.innerHTML = `

                <div class="day-name">
                    ${day.label}
                </div>

                <div class="day-date">
                    ${formatDayMonth(date)}
                </div>

            `;


            headerRow.appendChild(
                header
            );

        }
    );


    calendar.appendChild(
        headerRow
    );



    /*
    CUERPO
    */

    const body =
        document.createElement("div");


    body.className =
        "calendar-body";


    body.style.gridTemplateColumns =
        `${TIME_COLUMN_WIDTH}px repeat(${numberOfDays}, 1fr)`;


    body.style.height =
        `${bodyHeight}px`;



    /*
    COLUMNA HORAS
    */

    const timeColumn =
        document.createElement("div");


    timeColumn.className =
        "time-column";


    createTimeLines(
        timeColumn,
        bodyHeight
    );


    body.appendChild(
        timeColumn
    );



    /*
    COLUMNAS DÍAS
    */

    visibleDays.forEach(
        (day, index) => {

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
                column,
                bodyHeight
            );


            const dayEvents =
                getEventsForDate(
                    date,
                    day.key
                );


            const positionedEvents =
                assignOverlapPositions(
                    dayEvents
                );


            positionedEvents.forEach(
                event => {

                    createEventElement(
                        event,
                        column,
                        date
                    );

                }
            );


            body.appendChild(
                column
            );

        }
    );


    calendar.appendChild(
        body
    );


 updateWeekTitle();

   renderRoomFilters();

renderTeacherLegend();

/*
Reaplicamos el filtro después de reconstruir
el calendario.
*/

applyTeacherFilter();

scheduleEventLabelFit();

}



/* =========================================================
   CREAR LINEAS DE HORARIO
========================================================= */

function createTimeLines(
    container,
    bodyHeight
) {

    const totalHours =
        END_HOUR - START_HOUR;


    for (
        let i = 0;
        i <= totalHours;
        i++
    ) {

        const top =
            i * HOUR_HEIGHT;


        const line =
            document.createElement("div");


        line.className =
            "hour-line";


        line.style.top =
            `${top}px`;


        container.appendChild(
            line
        );


        const hour =
            START_HOUR + i;


        const label =
            document.createElement("div");


       label.className =
    "hour-label";


/*
Evita que la primera y última hora
se corten en los límites del calendario.
*/

if (i === 0) {

    label.classList.add(
        "first-hour"
    );

}

if (i === totalHours) {

    label.classList.add(
        "last-hour"
    );

}


label.style.top =
    `${top}px`;


        label.textContent =
            `${String(hour).padStart(2,"0")}:00`;


        container.appendChild(
            label
        );


        /*
        Media hora
        */

        if (i < totalHours) {

            const halfLine =
                document.createElement(
                    "div"
                );


            halfLine.className =
                "half-hour-line";


            halfLine.style.top =
                `${
                    top +
                    HOUR_HEIGHT / 2
                }px`;


            container.appendChild(
                halfLine
            );

        }

    }

}



function createBackgroundLines(
    container,
    bodyHeight
) {

    const totalHours =
        END_HOUR - START_HOUR;


    for (
        let i = 0;
        i <= totalHours;
        i++
    ) {

        const top =
            i * HOUR_HEIGHT;


        const line =
            document.createElement("div");


        line.className =
            "hour-line";


        line.style.top =
            `${top}px`;


        container.appendChild(
            line
        );


        if (i < totalHours) {

            const half =
                document.createElement(
                    "div"
                );


            half.className =
                "half-hour-line";


            half.style.top =
                `${
                    top +
                    HOUR_HEIGHT / 2
                }px`;


            container.appendChild(
                half
            );

        }

    }

}



/* =========================================================
   CREAR EVENTO
========================================================= */

function createEventElement(
    event,
    container,
    date
) {

    const startMinutes =
        timeToMinutes(event.start);


    const endMinutes =
        timeToMinutes(event.end);


    const calendarStart =
        START_HOUR * 60;


    const top =
        (
            startMinutes -
            calendarStart
        )
        /
        60
        *
        HOUR_HEIGHT;


    const durationMinutes =
        endMinutes -
        startMinutes;


    const height =
        durationMinutes
        /
        60
        *
        HOUR_HEIGHT;


    /*
    Eventos fuera del rango visible
    no se muestran.
    */

    if (
        endMinutes <= calendarStart ||
        startMinutes >= END_HOUR * 60
    ) {

        return;

    }


    const element =
        document.createElement("div");


    element.className =
        "event";

   element.dataset.teacher =
    event.teacher || "";


    /*
    COLOR
    */

    const colors =
        getTeacherColor(
            event.teacher
        );


    element.style.background =
        colors.background;


    element.style.borderColor =
        colors.border;


    element.style.color =
        colors.text;



    /*
    POSICIÓN VERTICAL
    */

    element.style.top =
        `${Math.max(0, top) + 2}px`;


    element.style.height =
        `${Math.max(20, height - 4)}px`;



    /*
    POSICIÓN HORIZONTAL

    Si hay eventos simultáneos,
    dividimos la columna.
    */

    const columns =
        event._columns || 1;


    const column =
        event._column || 0;


    const width =
        100 / columns;


    element.style.left =
        `calc(${column * width}% + 3px)`;


    element.style.width =
        `calc(${width}% - 6px)`;



    /*
    CONTENIDO
    */

    const fullTag =
    event.tag || "";


const initial =
    getTagInitial(
        fullTag
    );


element.innerHTML = `

    <div
        class="event-tag"
        data-full-tag="${escapeHTML(fullTag)}"
        data-initial="${escapeHTML(initial)}"
    >
        ${escapeHTML(fullTag)}
    </div>

    <div class="event-time">
        ${event.start}–${event.end}
    </div>

`;


    element.addEventListener(
        "click",
        () => {

            openEventModal(
                event,
                date,
                colors
            );

        }
    );

   


    container.appendChild(
        element
    );

}

/* =========================================================
   FUNCIÓN QUE OBTIENE LA INICIAL
========================================================= */

function getTagInitial(tag) {

    const clean =
        String(tag || "")
            .trim();


    if (!clean) {

        return "";

    }


    return clean
        .charAt(0)
        .toUpperCase();

}

/* =========================================================
   DETECTAR SI EL TEXTO CABE
========================================================= */

function fitEventLabels() {

    const tags =
        document.querySelectorAll(
            ".event-tag"
        );


    tags.forEach(tag => {

        const fullTag =
            tag.dataset.fullTag || "";

        const initial =
            tag.dataset.initial || "";


        /*
        Primero intentamos mostrar
        el texto completo.
        */

        tag.textContent =
            fullTag;


        /*
        Si el ancho disponible no es suficiente
        para una sola línea, mostramos inicial.
        */

        if (
            tag.scrollWidth >
            tag.clientWidth
        ) {

            tag.textContent =
                initial;

            tag.classList.add(
                "initial-only"
            );

        }

        else {

            tag.classList.remove(
                "initial-only"
            );

        }

    });

}
/* =========================================================
   otra función Ejecutarlo después del render 
========================================================= */
function scheduleEventLabelFit() {

    requestAnimationFrame(
        () => {

            fitEventLabels();

        }
    );

}


/* =========================================================
   LEYENDA DE MAESTROS
========================================================= */

function renderTeacherLegend() {

    const container =
        document.getElementById(
            "teacherLegend"
        );


    container.innerHTML = "";


    const teachers =
        Object.keys(
            teacherColorMap
        );


    teachers.forEach(
        teacher => {

            const colors =
                teacherColorMap[
                    teacher
                ];


            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "teacher-legend-item";

           item.dataset.teacher =
    teacher;


item.addEventListener(
    "click",
    () => {

        toggleTeacherFilter(
            teacher
        );

    }
);


            item.innerHTML = `

                <span
                    class="legend-dot"
                    style="
                        background:${colors.background};
                        border:1px solid ${colors.border};
                    "
                ></span>

                <span>
                    ${escapeHTML(teacher)}
                </span>

            `;


            container.appendChild(
                item
            );

        }
    );

}

/* =========================================================
   FILTRO VISUAL POR MAESTRO
========================================================= */

function toggleTeacherFilter(teacher) {

    /*
    Si tocamos nuevamente al mismo maestro,
    quitamos el filtro.
    */

    if (activeTeacher === teacher) {

        activeTeacher = null;

    }

    else {

        activeTeacher = teacher;

    }


    applyTeacherFilter();

}



function applyTeacherFilter() {

    const eventElements =
        document.querySelectorAll(
            ".event"
        );


    const legendItems =
        document.querySelectorAll(
            ".teacher-legend-item"
        );


    /*
    ============================
    EVENTOS
    ============================
    */

    eventElements.forEach(
        element => {

            element.classList.remove(
                "teacher-dimmed",
                "teacher-highlighted"
            );


            /*
            Si no hay selección,
            dejamos todos normales.
            */

            if (!activeTeacher) {

                return;

            }


            const teacher =
                element.dataset.teacher;


            if (
                teacher === activeTeacher
            ) {

                element.classList.add(
                    "teacher-highlighted"
                );

            }

            else {

                element.classList.add(
                    "teacher-dimmed"
                );

            }

        }
    );


    /*
    ============================
    LEYENDA
    ============================
    */

    legendItems.forEach(
        item => {

            item.classList.remove(
                "active",
                "inactive"
            );


            if (!activeTeacher) {

                return;

            }


            const teacher =
                item.dataset.teacher;


            if (
                teacher === activeTeacher
            ) {

                item.classList.add(
                    "active"
                );

            }

            else {

                item.classList.add(
                    "inactive"
                );

            }

        }
    );

}

/* =========================================================
   TÍTULO SEMANA
========================================================= */

function updateWeekTitle() {

    const endDate =
        addDays(
            currentWeekStart,
            showSunday ? 6 : 5
        );


    const startDay =
        currentWeekStart.getDate();


    const endDay =
        endDate.getDate();


    const startMonth =
        currentWeekStart.toLocaleDateString(
            "es-MX",
            {
                month: "long"
            }
        );


    const endMonth =
        endDate.toLocaleDateString(
            "es-MX",
            {
                month: "long"
            }
        );


    const year =
        endDate.getFullYear();


    let title;


    if (
        currentWeekStart.getMonth()
        ===
        endDate.getMonth()
    ) {

        title =
            `${startDay} – ${endDay} ${endMonth} ${year}`;

    }

    else {

        title =
            `${startDay} ${startMonth} – ${endDay} ${endMonth} ${year}`;

    }


    document.getElementById(
        "weekTitle"
    ).textContent = title;

}



/* =========================================================
   MODAL
========================================================= */

function openEventModal(
    event,
    date,
    colors
) {

    document.getElementById(
        "modalTag"
    ).textContent =
        event.tag || "Evento";


    document.getElementById(
        "modalTagDetail"
    ).textContent =
        event.tag || "—";


    document.getElementById(
        "modalTeacher"
    ).textContent =
        event.teacher || "—";


    document.getElementById(
        "modalRoom"
    ).textContent =
        event.room || "—";


    document.getElementById(
        "modalStart"
    ).textContent =
        event.start || "—";


    document.getElementById(
        "modalEnd"
    ).textContent =
        event.end || "—";


    document.getElementById(
        "modalType"
    ).textContent =
        capitalize(
            event.type || "—"
        );


    const type =
        normalizeText(event.type);


    if (
        type === "unico" ||
        type === "único"
    ) {

        document.getElementById(
            "modalDay"
        ).textContent =
            date.toLocaleDateString(
                "es-MX",
                {
                    weekday: "long"
                }
            );


        document.getElementById(
            "modalDate"
        ).textContent =
            formatLongDate(date);

    }

    else {

        document.getElementById(
            "modalDay"
        ).textContent =
            capitalize(
                event.day || "—"
            );


        document.getElementById(
            "modalDate"
        ).textContent =
            "Recurrente";

    }


    document.getElementById(
        "modalColor"
    ).style.background =
        colors.border;


    document.getElementById(
        "modalOverlay"
    ).classList.add(
        "visible"
    );

}



function closeModal() {

    document.getElementById(
        "modalOverlay"
    ).classList.remove(
        "visible"
    );

}



/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}



function capitalize(value) {

    if (!value) {

        return value;

    }


    return (
        value.charAt(0).toUpperCase()
        +
        value.slice(1)
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
    "showSunday"
).addEventListener(
    "change",
    event => {

        showSunday =
            event.target.checked;

        renderCalendar();

    }
);



document.getElementById(
    "closeModal"
).addEventListener(
    "click",
    closeModal
);



document.getElementById(
    "modalCloseButton"
).addEventListener(
    "click",
    closeModal
);



document.getElementById(
    "modalOverlay"
).addEventListener(
    "click",
    event => {

        if (
            event.target.id
            ===
            "modalOverlay"
        ) {

            closeModal();

        }

    }
);



document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape"
        ) {

            closeModal();

        }

    }
);

document.getElementById(
    "showAllRooms"
).addEventListener(
    "click",
    () => {

        selectedRooms.clear();

        renderCalendar();

    }
);

/* =========================================================
   INICIAR
========================================================= */

loadEventsFromURL();

createTeacherColorMap();

renderCalendar();

window.addEventListener(
    "resize",
    () => {

        scheduleEventLabelFit();

    }
);
