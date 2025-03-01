export const filterConfigs = [
  {
    type: "multiSelect",
    value: "Class",
    label: "Class",
    showClear: true,
    getOptions: (classes) => classes
  },
  {
    type: "multiSelect",
    value: "Comment Only",
    label: "Comment Only",
    showClear: true
  },
  {
    type: "dateRange",
    value: "Created Date",
    label: "Created Date",
    rangeKey: "created",
    showClear: true
  },
  {
    type: "dateRange",
    value: "Updated Date",
    label: "Updated Date",
    rangeKey: "updated",
    showClear: true
  }
];