// frontend/src/components/Whiteboard.jsx
import React, { useRef, useState, useEffect } from "react";
import { Stage, Layer, Line, Rect, Circle, Arrow, Text } from "react-konva";
import { io } from "socket.io-client";
import { saveAs } from "file-saver";

export default function Whiteboard({ workspaceId }) {
  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState("#000000");
  const [size, setSize] = useState(3);
  const [elements, setElements] = useState([[]]); // Multi-page
  const [pageIndex, setPageIndex] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [scale, setScale] = useState(1);

  const stageRef = useRef();
  const socketRef = useRef(null);

  // 🔌 Connect to Socket.io
  useEffect(() => {
    const socket = io("http://localhost:5000");
    socketRef.current = socket;

    socket.emit("join-whiteboard", workspaceId);
    socket.on("draw-data", (data) => {
      setElements(data);
    });

    return () => {
      socket.emit("leave-whiteboard", workspaceId);
      socket.disconnect();
    };
  }, [workspaceId]);

  const broadcast = (data) => {
    socketRef.current.emit("draw", workspaceId, data);
  };

  const currentPage = elements[pageIndex] || [];

  // ✏️ Mouse handlers
  const handleMouseDown = (e) => {
    setIsDrawing(true);
    const pos = e.target.getStage().getPointerPosition();

    let newShape;
    switch (tool) {
      case "pen":
      case "highlighter":
        newShape = { tool, color, size, points: [pos.x, pos.y] };
        break;
      case "rect":
      case "circle":
      case "arrow":
        newShape = { tool, color, size, x: pos.x, y: pos.y, width: 0, height: 0 };
        break;
      case "sticky":
        // eslint-disable-next-line no-case-declarations
        const text = prompt("Enter note text:");
        if (!text) return setIsDrawing(false);
        newShape = {
          tool: "sticky",
          text,
          color: "#fffa9e",
          x: pos.x,
          y: pos.y,
          width: 150,
          height: 100,
        };
        break; 
      case "text":
        // eslint-disable-next-line no-case-declarations
        const input = prompt("Enter text:");
        if (!input) return setIsDrawing(false);
        newShape = { tool: "text", text: input, color, x: pos.x, y: pos.y, size };
        break;
      default:
        return;
    }

    const updated = [...currentPage, newShape];
    const newData = [...elements];
    newData[pageIndex] = updated;
    setElements(newData);
    broadcast(newData);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    const updated = [...elements];
    const page = [...updated[pageIndex]];
    const last = page[page.length - 1];

    if (!last) return;

    if (["pen", "highlighter"].includes(last.tool)) {
      last.points = last.points.concat([point.x, point.y]);
    } else if (["rect", "circle", "arrow"].includes(last.tool)) {
      last.width = point.x - last.x;
      last.height = point.y - last.y;
    }

    updated[pageIndex] = page;
    setElements(updated);
    broadcast(updated);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    setHistory([...history, elements]);
    setRedoStack([]);
  };

  // 🧠 Undo / Redo
  const handleUndo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setRedoStack([elements, ...redoStack]);
    setElements(prev);
    setHistory(history.slice(0, -1));
    broadcast(prev);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[0];
    setElements(next);
    setRedoStack(redoStack.slice(1));
    broadcast(next);
  };

  // 🧹 Clear
  const handleClear = () => {
    const newData = elements.map((p, i) => (i === pageIndex ? [] : p));
    setElements(newData);
    broadcast(newData);
  };

  // 🖼 Export
  const exportAsImage = () => {
    const uri = stageRef.current.toDataURL();
    saveAs(uri, `whiteboard_page${pageIndex + 1}.png`);
  };

  // 📄 Add / Navigate Pages
  const addPage = () => {
    setElements([...elements, []]);
    setPageIndex(elements.length);
  };

  const zoomIn = () => setScale(scale * 1.1);
  const zoomOut = () => setScale(scale / 1.1);

  return (
    <div className="flex flex-col w-full h-screen bg-gray-100">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 p-2 bg-white shadow-md items-center">
        <select
          value={tool}
          onChange={(e) => setTool(e.target.value)}
          className="p-1 border rounded"
        >
          <option value="pen">Pen</option>
          <option value="highlighter">Highlighter</option>
          <option value="eraser">Eraser</option>
          <option value="rect">Rectangle</option>
          <option value="circle">Circle</option>
          <option value="arrow">Arrow</option>
          <option value="text">Text</option>
          <option value="sticky">Sticky Note</option>
        </select>

        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
        <input
          type="range"
          min="1"
          max="20"
          value={size}
          onChange={(e) => setSize(Number(e.target.value))}
        />
        <span>{size}px</span>

        <button onClick={handleUndo} className="px-3 py-1 bg-yellow-300 rounded">
          Undo
        </button>
        <button onClick={handleRedo} className="px-3 py-1 bg-orange-300 rounded">
          Redo
        </button>
        <button onClick={handleClear} className="px-3 py-1 bg-red-400 text-white rounded">
          Clear
        </button>
        <button onClick={exportAsImage} className="px-3 py-1 bg-green-500 text-white rounded">
          Export PNG
        </button>
        <button onClick={addPage} className="px-3 py-1 bg-blue-400 text-white rounded">
          + Page
        </button>

        <button onClick={zoomIn} className="px-2 py-1 bg-gray-200 rounded">
          🔍+
        </button>
        <button onClick={zoomOut} className="px-2 py-1 bg-gray-200 rounded">
          🔍-
        </button>

        <span className="ml-4 text-sm text-gray-500">
          Page {pageIndex + 1} / {elements.length}
        </span>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-hidden">
        <Stage
          width={window.innerWidth - 260}
          height={window.innerHeight - 100}
          scaleX={scale}
          scaleY={scale}
          ref={stageRef}
          onMouseDown={handleMouseDown}
          onMousemove={handleMouseMove}
          onMouseup={handleMouseUp}
          style={{ background: "white", margin: "auto", cursor: tool === "eraser" ? "crosshair" : "default" }}
        >
          <Layer>
            {currentPage.map((el, i) => {
              switch (el.tool) {
                case "pen":
                case "highlighter":
                  return (
                    <Line
                      key={i}
                      points={el.points}
                      stroke={el.color}
                      strokeWidth={el.size}
                      opacity={el.tool === "highlighter" ? 0.3 : 1}
                      lineCap="round"
                      tension={0.5}
                    />
                  );
                case "rect":
                  return (
                    <Rect
                      key={i}
                      x={el.x}
                      y={el.y}
                      width={el.width}
                      height={el.height}
                      stroke={el.color}
                      strokeWidth={el.size}
                      draggable
                    />
                  );
                case "circle":
                  return (
                    <Circle
                      key={i}
                      x={el.x + el.width / 2}
                      y={el.y + el.height / 2}
                      radius={Math.abs(el.width / 2)}
                      stroke={el.color}
                      strokeWidth={el.size}
                      draggable
                    />
                  );
                case "arrow":
                  return (
                    <Arrow
                      key={i}
                      points={[el.x, el.y, el.x + el.width, el.y + el.height]}
                      stroke={el.color}
                      strokeWidth={el.size}
                      pointerLength={10}
                      pointerWidth={10}
                    />
                  );
                case "text":
                  return (
                    <Text
                      key={i}
                      text={el.text}
                      x={el.x}
                      y={el.y}
                      fontSize={el.size * 4}
                      fill={el.color}
                      draggable
                    />
                  );
                case "sticky":
                  return (
                    <Rect
                      key={`rect-${i}`}
                      x={el.x}
                      y={el.y}
                      width={el.width}
                      height={el.height}
                      fill={el.color}
                      shadowBlur={5}
                      cornerRadius={10}
                      draggable
                    />
                  );
                default:
                  return null;
              }
            })}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}
