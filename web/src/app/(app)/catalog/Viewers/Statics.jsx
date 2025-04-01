import React, { useEffect, useRef } from "react";
import { Chart } from "chart.js/auto";

const Statics = ({ images, classes, selectedImageIds, setSelectedImageIds }) => {
  const classChartRef = useRef(null);
  const modelChartRef = useRef(null);
  const approvalChartRef = useRef(null);
  const commentChartRef = useRef(null);
  const selectedImageIdsRef = useRef(setSelectedImageIds);

  useEffect(() => {
    if (!images || images.length === 0 || !classes || classes.length === 0) return;

    // Map class IDs to names and colors
    const classIdToInfoMap = classes.reduce((acc, cls) => {
      acc[cls.id] = { name: cls.name, color: cls.color };
      return acc;
    }, {});

    // 1. Class Distribution
    const classCounts = images.reduce((acc, image) => {
      const classInfo = classIdToInfoMap[image.classIds] || { name: "Unknown", color: "#CCCCCC" };
      const { name, color } = classInfo;

      if (!acc[name]) {
        acc[name] = { count: 0, color, ids: [] };
      }
      acc[name].count += 1;
      acc[name].ids.push(image.id);

      return acc;
    }, {});

    const classLabels = Object.keys(classCounts);
    const classData = classLabels.map((label) => classCounts[label].count);
    const classColors = classLabels.map((label) => classCounts[label].color);
    const classImageIds = classLabels.map((label) => classCounts[label].ids);

    // 2. Model Status
    const modelCounts = images.reduce(
      (acc, image) => {
        if (image.model?.dinov2) {
          acc.processed.count += 1;
          acc.processed.ids.push(image.id);
        } else {
          acc.unprocessed.count += 1;
          acc.unprocessed.ids.push(image.id);
        }
        return acc;
      },
      { processed: { count: 0, ids: [] }, unprocessed: { count: 0, ids: [] } }
    );

    // 3. Approval Status
    const approvalCounts = images.reduce(
      (acc, image) => {
        if (image.approval === "approved") {
          acc.approved.count += 1;
          acc.approved.ids.push(image.id);
        } else if (image.approval === "reject") {
          acc.reject.count += 1;
          acc.reject.ids.push(image.id);
        } else {
          acc.pending.count += 1;
          acc.pending.ids.push(image.id);
        }
        return acc;
      },
      {
        approved: { count: 0, ids: [] },
        reject: { count: 0, ids: [] },
        pending: { count: 0, ids: [] },
      }
    );

    // 4. Commented vs. Not Commented
    const commentCounts = images.reduce(
      (acc, image) => {
        if (image.comment && image.comment.trim() !== "") {
          acc.commented.count += 1;
          acc.commented.ids.push(image.id);
        } else {
          acc.notCommented.count += 1;
          acc.notCommented.ids.push(image.id);
        }
        return acc;
      },
      {
        commented: { count: 0, ids: [] },
        notCommented: { count: 0, ids: [] },
      }
    );

    // Helper function to create a chart
    const createChart = (ref, type, labels, data, backgroundColors, ids) => {
      if (!ref.current) return;
    
      const ctx = ref.current.getContext("2d");
    
      // Destroy existing chart instance if it exists
      if (ref.current._chartInstance) {
        ref.current._chartInstance.destroy();
      }
    
      ref.current._chartInstance = new Chart(ctx, {
        type,
        data: {
          labels,
          datasets: [
            {
              data,
              backgroundColor: labels.map((_, index) =>
                ids[index].some((id) => selectedImageIds.includes(id))
                  ? backgroundColors[index].replace(/[^,]+(?=\))/, "0.8") // Highlight color
                  : backgroundColors[index]
              ),
              borderColor: labels.map((_, index) =>
                ids[index].some((id) => selectedImageIds.includes(id)) ? "black" : backgroundColors[index]
              ),
              borderWidth: labels.map((_, index) =>
                ids[index].some((id) => selectedImageIds.includes(id)) ? 3 : 1
              ),
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            tooltip: {
              callbacks: {
                label: (context) =>
                  `${context.label}: ${context.raw} (${(
                    (context.raw / images.length) *
                    100
                  ).toFixed(2)}%)`,
              },
            },
          },
          onClick: (event, elements) => {
            if (elements.length > 0) {
              const index = elements[0].index;
              setSelectedImageIds(ids[index]);
            }
          },
        },
      });
    };    

    
    // Create each chart
    createChart(classChartRef, "pie", classLabels, classData, classColors, classImageIds);
    createChart(
      modelChartRef,
      "doughnut",
      ["Processed", "Unprocessed"],
      [modelCounts.processed.count, modelCounts.unprocessed.count],
      ["#4CAF50", "#FF5722"],
      [modelCounts.processed.ids, modelCounts.unprocessed.ids]
    );
    createChart(
      approvalChartRef,
      "bar",
      ["Approved", "Reject", "Pending"],
      [approvalCounts.approved.count, approvalCounts.reject.count, approvalCounts.pending.count],
      ["#4CAF50", "#FF5722", "#FFC107"],
      [approvalCounts.approved.ids, approvalCounts.reject.ids, approvalCounts.pending.ids]
    );
    createChart(
      commentChartRef,
      "pie",
      ["Commented", "Not Commented"],
      [commentCounts.commented.count, commentCounts.notCommented.count],
      ["#2196F3", "#9E9E9E"],
      [commentCounts.commented.ids, commentCounts.notCommented.ids]
    );

    return () => {
      // Cleanup charts on unmount
      [classChartRef, modelChartRef, approvalChartRef, commentChartRef].forEach((ref) => {
        if (ref.current && ref.current._chartInstance) {
          ref.current._chartInstance.destroy();
        }
      });
    };
  }, [images, classes]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", padding: "20px" }}>
      <div>
        <h3>Class Distribution</h3>
        <canvas ref={classChartRef}></canvas>
      </div>
      <div>
        <h3>Model Status</h3>
        <canvas ref={modelChartRef}></canvas>
      </div>
      <div>
        <h3>Approval Status</h3>
        <canvas ref={approvalChartRef}></canvas>
      </div>
      <div>
        <h3>Comments Status</h3>
        <canvas ref={commentChartRef}></canvas>
      </div>
    </div>
  );
};

export default Statics;
