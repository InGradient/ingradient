export const extractUniqueAndRange = (images) => {
  const models = new Set();
  const labeledBySet = new Set();
  const editedBySet = new Set();
  const uploadedBySet = new Set();
  const uploadedDates = [];
  const updatedDates = [];

  Object.values(images).forEach((item) => {
    if (item.model) models.add(Object.keys(item.model)[0]);
    labeledBySet.add(item.labeledBy);
    editedBySet.add(item.editedBy);
    uploadedBySet.add(item.uploadedBy);

    // Validate and parse date values
    const uploadedDate = new Date(item.uploadedAt);
    if (!isNaN(uploadedDate)) {
      uploadedDates.push(uploadedDate);
    }

    const updatedDate = new Date(item.updatedAt);
    if (!isNaN(updatedDate)) {
      updatedDates.push(updatedDate);
    }
  });

  const uniqueModels = Array.from(models);
  const uniqueLabeledBy = Array.from(labeledBySet);
  const uniqueEditedBy = Array.from(editedBySet);
  const uniqueUploadedBy = Array.from(uploadedBySet);

  // Handle empty date arrays to prevent `Math.min` and `Math.max` errors
  const uploadedRange = uploadedDates.length
    ? {
        min: new Date(Math.min(...uploadedDates)).toISOString().split("T")[0],
        max: new Date(Math.max(...uploadedDates)).toISOString().split("T")[0],
      }
    : { min: "", max: "" };

  const updatedRange = updatedDates.length
    ? {
        min: new Date(Math.min(...updatedDates)).toISOString().split("T")[0],
        max: new Date(Math.max(...updatedDates)).toISOString().split("T")[0],
      }
    : { min: "", max: "" };

  return {
    uniqueModels,
    uniqueLabeledBy,
    uniqueEditedBy,
    uniqueUploadedBy,
    uploadedRange,
    updatedRange,
  };
};

/**
 * Filters data based on various criteria.
 * @param {Array} data - The dataset to filter.
 * @param {Object} filters - The filters to apply.
 *    filters 객체의 예:
 *    {
 *      class: [/* class id 목록 * /],
 *      commentOnly: true/false,
 *      labeledBy: [/* 사용자 목록 * /],
 *      editedBy: [/* 사용자 목록 * /],
 *      uploadedBy: [/* 사용자 목록 * /],
 *      dateRange: {
 *         uploaded: { start: "YYYY-MM-DD", end: "YYYY-MM-DD" },
 *         updated: { start: "YYYY-MM-DD", end: "YYYY-MM-DD" }
 *      },
 *      inferenceBy: [/* 모델 목록 * /],
 *      approval: [/* "Approved", "Denied" 등 * /],
 *      selectedModel: "모델명" // 필요하면 추가
 *    }
 * @returns {Array} - The filtered dataset.
 */
export const filterData = (data, filters) => {
  return Object.values(data).filter((item) => {
    // Class filter: filters["Class"]는 배열이며, 데이터의 클래스는 item.classId 사용
    if (
      filters.Class &&
      filters.Class.length > 0 &&
      item.classId &&
      !filters.Class.includes(item.classId)
    ) {
      return false;
    }

    // Comment only filter (Boolean) -> filters["Comment Only"]
    if (filters["Comment Only"] && !item.comment) {
      return false;
    }

    // User filters: labeledBy, editedBy, uploadedBy (키 이름은 그대로 사용)
    if (
      filters.labeledBy &&
      filters.labeledBy.length > 0 &&
      !filters.labeledBy.includes(item.labeledBy)
    ) {
      return false;
    }
    if (
      filters.editedBy &&
      filters.editedBy.length > 0 &&
      !filters.editedBy.includes(item.editedBy)
    ) {
      return false;
    }
    if (
      filters.uploadedBy &&
      filters.uploadedBy.length > 0 &&
      !filters.uploadedBy.includes(item.uploadedBy)
    ) {
      return false;
    }

    // Date range filters (Uploaded)
    if (filters.dateRange && filters.dateRange.uploaded) {
      const uploadedAt = new Date(item.uploadedAt);
      if (
        filters.dateRange.uploaded.start &&
        uploadedAt < new Date(filters.dateRange.uploaded.start)
      ) {
        return false;
      }
      if (
        filters.dateRange.uploaded.end &&
        uploadedAt > new Date(filters.dateRange.uploaded.end)
      ) {
        return false;
      }
    }

    // Date range filters (Updated)
    if (filters.dateRange && filters.dateRange.updated) {
      const updatedAt = new Date(item.updatedAt);
      if (
        filters.dateRange.updated.start &&
        updatedAt < new Date(filters.dateRange.updated.start)
      ) {
        return false;
      }
      if (
        filters.dateRange.updated.end &&
        updatedAt > new Date(filters.dateRange.updated.end)
      ) {
        return false;
      }
    }

    // Inference By filter: filters.inferenceBy는 배열로 관리하며, 데이터의 model의 첫 번째 키를 사용
    if (
      filters.inferenceBy &&
      filters.inferenceBy.length > 0 &&
      item.model &&
      !filters.inferenceBy.includes(Object.keys(item.model)[0])
    ) {
      return false;
    }

    // Approval filter: filters.approval는 배열로 관리하며, 데이터의 approval 필드를 사용
    if (
      filters.approval &&
      filters.approval.length > 0 &&
      !filters.approval.includes(item.approval)
    ) {
      return false;
    }

    // Model filter (selectedModel)
    if (filters.selectedModel) {
      const modelName = item.model ? Object.keys(item.model)[0] : "";
      if (modelName !== filters.selectedModel) {
        return false;
      }
    }

    return true;
  });
};


/**
 * Sorts data based on multiple sort criteria
 * @param {Array} data - The dataset to sort.
 * @param {Array} sortCriteria - Array of sort criteria objects [{option: string, order: string}]
 * @returns {Array} - The sorted dataset.
 */
export const sortData = (data, sortCriteria) => {
  if (!sortCriteria || !sortCriteria.length) return [...data];
  
  const sorted = [...data];
  return sorted.sort((a, b) => {
    // 각 정렬 기준을 순서대로 적용
    for (const { option, order } of sortCriteria) {
      let comparison = 0;
      
      switch (option) {
        case "uploadedAt":
          comparison = new Date(a.uploadedAt) - new Date(b.uploadedAt);
          break;
        case "updatedAt":
          comparison = new Date(a.updatedAt) - new Date(b.updatedAt);
          break;
        case "class":
          // 이미지 객체에서는 클래스 정보가 classId에 저장됨
          comparison = (a.classId || "").localeCompare(b.classId || "");
          break;
        case "fileName":
          // 파일 이름은 filename 속성을 사용 (소문자 n)
          comparison = (a.filename || "").localeCompare(b.filename || "");
          break;
        case "labeledBy":
          comparison = (a.labeledBy || "").localeCompare(b.labeledBy || "");
          break;
        case "editedBy":
          comparison = (a.editedBy || "").localeCompare(b.editedBy || "");
          break;
        case "uploadedBy":
          comparison = (a.uploadedBy || "").localeCompare(b.uploadedBy || "");
          break;
        default:
          comparison = 0;
      }
      
      // 정렬 순서 적용
      if (comparison !== 0) {
        return order === "asc" ? comparison : -comparison;
      }
    }
    return 0;
  });
};


/**
 * Groups data based on a specified key.
 * @param {Array} data - The dataset to group.
 * @param {String} groupByOption - The key to group by.
 * @returns {Array} - An array of grouped data objects.
 */
export const groupData = (data, groupByOption) => {
  if (groupByOption === null) {
    return [
      {
        key: "all",
        values: data,
      },
    ];
  }

  const grouped = {};
  data.forEach((item) => {
    const key =
      groupByOption === "class"
        ? item.classId
        : groupByOption === "approvedDenied"
        ? item.status
        : groupByOption === "uploadedAt"
        ? new Date(item.uploadedAt).toDateString()
        : groupByOption === "updatedAt"
        ? new Date(item.updatedAt).toDateString()
        : groupByOption === "labeledBy"
        ? item.labeledBy
        : groupByOption === "editedBy"
        ? item.editedBy
        : groupByOption === "inferenceBy"
        ? item.inferenceBy
        : null;

    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(item);
  });

  return Object.entries(grouped).map(([key, values]) => ({ key, values }));
};
