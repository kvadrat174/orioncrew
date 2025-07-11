// Дано: массив заголовков и массив значений

// const titles = [
//     { key: 'id',  title: 'ID'},
//     { key: 'name',  title: 'Имя'},
//     { key: 'code',  title: 'Код'},
// ]

// const data = [
//     { id: '1', 'name': 'John Doe', code: '001' },
//     { id: '2', 'name': 'Lawrence Smith', code: '001' },
//     { id: '3', 'name': 'Jolene Parton', code: '001' },
// ]

// Необходимо:

// Реализовать React-компонент, который построит из этих данных таблицу (для экрана шире 768 пикселей)
// или список карточек с данными (для экранов шириной до 768 пикселей включительно).
// Минимальное разрешение, на котором информация должна быть читаема -- 375 пикселей

// Желательно реализовать с применением TypeScript,
// JSS или SCSS -- на усмотрение кандидата.
// Дизайн -- на усмотрение кандидата.

import React, { useState } from "react";
import useResponsiveTableStyles from "./ResponsiveTable.styles";

// Типы данных
interface TableColumn {
  key: string;
  title: string;
}

interface DataItem {
  [key: string]: string;
}

interface ResponsiveTableProps {
  titles: TableColumn[];
  data: DataItem[];
  useGrid?: boolean;
}

// Основной компонент таблицы
const ResponsiveTable: React.FC<ResponsiveTableProps> = ({
  titles,
  data,
  useGrid = false,
}) => {
  const styles = useResponsiveTableStyles();

  return (
    <div className={styles.responsiveTable}>
      {/* Десктопная таблица */}
      {/* Переключение стилей для грида и флексбокса по свитчеру */}
      <div
        className={`${styles.desktopTable} ${
          useGrid ? styles.tableGrid : styles.tableFlexbox
        }`}
      >
        <div className={styles.tableHeader}>
          {titles.map((title) => (
            <div key={title.key} className={styles.headerCell}>
              {title.title}
            </div>
          ))}
        </div>
        <div className={styles.tableBody}>
          {data.map((item, index) => (
            <div key={item.id || index} className={styles.tableRow}>
              {titles.map((title) => (
                <div key={title.key} className={styles.tableCell}>
                  {item[title.key]}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Карточки для мобилки */}
      <div className={styles.mobileCards}>
        <div className={useGrid ? styles.cardsGrid : styles.cardsFlexbox}>
          {data.map((item, index) => (
            <div key={item.id || index} className={styles.card}>
              {titles.map((title) => (
                <div key={title.key} className={styles.cardRow}>
                  <div className={styles.cardLabel}>{title.title}:</div>
                  <div className={styles.cardValue}>{item[title.key]}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Компонент со свитчером
const ResponsiveTableDemo: React.FC = () => {
  const [useGrid, setUseGrid] = useState(false);
  const styles = useResponsiveTableStyles();

  // Дата для таблички и карточек
  const titles: TableColumn[] = [
    { key: "id", title: "ID" },
    { key: "name", title: "Имя" },
    { key: "code", title: "Код" },
  ];

  const data: DataItem[] = [
    { id: "1", name: "John Doe", code: "001" },
    { id: "2", name: "Lawrence Smith", code: "002" },
    { id: "3", name: "Jolene Parton", code: "003" },
    { id: "4", name: "Michael Johnson", code: "004" },
    { id: "5", name: "Sarah Wilson", code: "005" },
  ];

  const handleToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUseGrid(event.target.checked);
  };

  return (
    <div className={styles.demoContainer}>
      {/* Контролы */}
      <div className={styles.demoControls}>
        <label className={styles.switchContainer}>
          <input type="checkbox" checked={useGrid} onChange={handleToggle} />
          <span
            className={`${styles.slider} ${
              useGrid ? styles.sliderChecked : ""
            }`}
          />
        </label>
        <span className={styles.switchLabel}>
          Режим отображения: {useGrid ? "CSS Grid" : "Flexbox"}
        </span>
      </div>

      {/* Таблица */}
      <ResponsiveTable titles={titles} data={data} useGrid={useGrid} />

      {/* Инфо */}
      <div className={styles.infoPanel}>
        <h3>JSS + TypeScript Реализация</h3>
        <p>
          Стили описаны в отдельном файле см.ниже. Измени размер окна или
          переключи режим выше для проверки адаптивности.
        </p>
      </div>
    </div>
  );
};

export default ResponsiveTableDemo;

// Стили компонента (import через styles)
import { createUseStyles } from "react-jss";

const useResponsiveTableStyles = createUseStyles({
  // Контейнер демо
  demoContainer: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: 20,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',

    "@media (max-width: 768px)": {
      padding: 12,
    },
  },

  // Контролы переключения
  demoControls: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
    padding: 16,
    background: "#f8f9fa",
    borderRadius: 8,

    "@media (max-width: 768px)": {
      flexDirection: "column",
      textAlign: "center",
      gap: 8,
    },
  },

  switchContainer: {
    position: "relative",
    display: "inline-block",
    width: 60,
    height: 32,

    "& input": {
      opacity: 0,
      width: 0,
      height: 0,
    },
  },

  slider: {
    position: "absolute",
    cursor: "pointer",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#ccc",
    transition: "0.3s",
    borderRadius: 32,

    "&:before": {
      position: "absolute",
      content: '""',
      height: 24,
      width: 24,
      left: 4,
      bottom: 4,
      backgroundColor: "white",
      transition: "0.3s",
      borderRadius: "50%",
    },
  },

  sliderChecked: {
    backgroundColor: "#2196F3",

    "&:before": {
      transform: "translateX(28px)",
    },
  },

  switchLabel: {
    fontWeight: 500,
    color: "#333",
  },

  // Основной контейнер таблицы
  responsiveTable: {
    background: "white",
    borderRadius: 12,
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    overflow: "hidden",
    marginBottom: 24,
  },

  // Десктопная таблица
  desktopTable: {
    display: "block",

    "@media (max-width: 768px)": {
      display: "none",
    },
  },

  // Flexbox вариант таблицы
  tableFlexbox: {
    "& $tableHeader": {
      display: "flex",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      color: "white",
      fontWeight: 600,
    },

    "& $headerCell": {
      flex: 1,
      padding: 16,
      textAlign: "left",
      borderRight: "1px solid rgba(255, 255, 255, 0.2)",

      "&:last-child": {
        borderRight: "none",
      },
    },

    "& $tableBody": {
      display: "flex",
      flexDirection: "column",
    },

    "& $tableRow": {
      display: "flex",
      borderBottom: "1px solid #e5e7eb",
      transition: "background-color 0.2s",

      "&:hover": {
        backgroundColor: "#f9fafb",
      },

      "&:last-child": {
        borderBottom: "none",
      },
    },

    "& $tableCell": {
      flex: 1,
      padding: 16,
      borderRight: "1px solid #e5e7eb",

      "&:last-child": {
        borderRight: "none",
      },
    },
  },

  // Grid вариант таблицы
  tableGrid: {
    "& $tableHeader": {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      color: "white",
      fontWeight: 600,
    },

    "& $headerCell": {
      padding: 16,
      textAlign: "left",
      borderRight: "1px solid rgba(255, 255, 255, 0.2)",

      "&:last-child": {
        borderRight: "none",
      },
    },

    "& $tableBody": {
      display: "grid",
      gridTemplateRows: "repeat(auto-fit, minmax(50px, auto))",
    },

    "& $tableRow": {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      borderBottom: "1px solid #e5e7eb",
      transition: "background-color 0.2s",

      "&:hover": {
        backgroundColor: "#f9fafb",
      },

      "&:last-child": {
        borderBottom: "none",
      },
    },

    "& $tableCell": {
      padding: 16,
      borderRight: "1px solid #e5e7eb",
      display: "flex",
      alignItems: "center",

      "&:last-child": {
        borderRight: "none",
      },
    },
  },

  // Базовые элементы таблицы
  tableHeader: {},
  headerCell: {},
  tableBody: {},
  tableRow: {},
  tableCell: {},

  // Мобильные карточки
  mobileCards: {
    display: "none",

    "@media (max-width: 768px)": {
      display: "block",
    },
  },

  // Flexbox вариант карточек
  cardsFlexbox: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },

  // Grid вариант карточек
  cardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: 16,
  },

  // Отдельная карточка
  card: {
    background: "white",
    borderRadius: 12,
    padding: 20,
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    border: "1px solid #e5e7eb",
    transition: "transform 0.2s, box-shadow 0.2s",

    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.15)",
    },

    "@media (max-width: 375px)": {
      padding: 16,
    },
  },

  // Строка внутри карточки
  cardRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 0",
    borderBottom: "1px solid #f3f4f6",

    "&:last-child": {
      borderBottom: "none",
    },

    "@media (max-width: 375px)": {
      flexDirection: "column",
      alignItems: "flex-start",
      gap: 4,
    },
  },

  // Лейбл в карточке
  cardLabel: {
    fontWeight: 600,
    color: "#374151",
    minWidth: 60,
  },

  // Значение в карточке
  cardValue: {
    color: "#6b7280",
    textAlign: "right",
    flex: 1,
    marginLeft: 12,

    "@media (max-width: 375px)": {
      textAlign: "left",
      marginLeft: 0,
    },
  },

  // Информационная панель
  infoPanel: {
    background: "#f0f9ff",
    border: "1px solid #0ea5e9",
    borderRadius: 8,
    padding: 16,
    textAlign: "center",

    "& h3": {
      margin: "0 0 8px 0",
      color: "#0369a1",
      fontSize: 18,
    },

    "& p": {
      margin: 0,
      color: "#075985",
      fontSize: 14,
    },
  },
});

export default useResponsiveTableStyles;
