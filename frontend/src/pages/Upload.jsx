import { useEffect, useRef, useState } from "react";
import { Camera, Circle, FileImage, LoaderCircle, UploadCloud, X } from "lucide-react";
import { analyzePosture, createSession, stopSession } from "../services/api";
import AnglePanel from "../components/AnglePanel";

export default function Upload() {
  const inputRef = useRef(null);
  const cameraRef = useRef(null);
  const captureCanvasRef = useRef(null);
  const streamRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  useEffect(() => {
    if (!cameraOpen || !cameraRef.current || !streamRef.current) return;
    cameraRef.current.srcObject = streamRef.current;
    cameraRef.current.play().catch(() => {});
  }, [cameraOpen]);
  useEffect(() => () => streamRef.current?.getTracks().forEach((track) => track.stop()), []);
  const choose = (nextFile) => {
    if (!nextFile || !["image/jpeg", "image/png"].includes(nextFile.type)) {
      setError("กรุณาเลือกไฟล์ภาพ JPG, JPEG หรือ PNG");
      return;
    }
    setError("");
    setResult(null);
    setFile(nextFile);
    setPreview(URL.createObjectURL(nextFile));
  };
  const analyze = async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const session = await createSession();
      const analysis = await analyzePosture(session.id, file);
      await stopSession(session.id);
      setResult(analysis);
    } catch (reason) {
      setError(reason.message || "วิเคราะห์ภาพไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };
  const openCamera = async () => {
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setCameraOpen(true);
      setError("");
    } catch (reason) {
      setError(reason.name === "NotAllowedError" ? "กรุณาอนุญาตการเข้าถึงกล้อง" : "ไม่สามารถเปิดกล้องได้");
    }
  };
  const closeCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOpen(false);
  };
  const capturePhoto = () => {
    const video = cameraRef.current;
    const canvas = captureCanvasRef.current;
    if (!video?.videoWidth || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) choose(new File([blob], "webcam-posture.jpg", { type: "image/jpeg" }));
      closeCamera();
    }, "image/jpeg", 0.88);
  };
  return (
    <div className="page-container">
      <div className="page-heading">
        <div>
            <h1>
            ลองดูท่านั่งของคุณผ่านภาพถ่าย
          </h1>
          <p>
            เลือกภาพท่านั่งที่เห็นร่างกายชัดเจน แล้วให้ระบบช่วยอ่านมุมต่าง ๆ
          </p>
        </div>
      </div>
      <div className="upload-layout">
        <section
          className={`drop-zone ${preview ? "has-file" : ""}`}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            choose(event.dataTransfer.files[0]);
          }}
        >
          {preview ? (
            <>
              <img src={preview} alt="Posture preview" />
              <button
                className="remove-image"
                onClick={() => {
                  setFile(null);
                  setPreview("");
                  setResult(null);
                }}
              >
                <X size={16} />
              </button>
            </>
          ) : (
            <>
              <FileImage size={42} />
              <h2>เลือกรูปท่านั่งของคุณ</h2>
              <p>
                แนะนำให้เห็นตั้งแต่ศีรษะถึงข้อเท้า รองรับ JPG, JPEG และ PNG
              </p>
              <button
                className="button secondary"
                onClick={() => inputRef.current?.click()}
              >
                <UploadCloud size={17} /> เลือกรูปภาพ
              </button>
              <button className="button secondary" onClick={openCamera}>
                <Camera size={17} /> ใช้กล้องถ่ายภาพ
              </button>
              <input
                ref={inputRef}
                hidden
                type="file"
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                onChange={(event) => choose(event.target.files[0])}
              />
            </>
          )}
          {cameraOpen && (
            <div className="capture-panel">
              <video ref={cameraRef} muted playsInline />
              <canvas ref={captureCanvasRef} hidden />
              <div className="capture-actions">
                <button className="button primary" onClick={capturePhoto}><Circle size={17} /> ถ่ายภาพ</button>
                <button className="button secondary" onClick={closeCamera}>ยกเลิก</button>
              </div>
            </div>
          )}
        </section>
        <section className="analysis-column">
          <div className="panel intro-panel">
            <span className="eyebrow">ดูผลได้ในไม่กี่วินาที</span>
            <h2>สรุปท่านั่งให้คุณ</h2>
            <p>
              เราจะสรุปคะแนน RULA มุมของร่างกาย ระดับความเสี่ยง
              และคำแนะนำที่นำไปปรับใช้ได้จริง
            </p>
            <button
              className="button primary"
              disabled={!file || loading}
              onClick={analyze}
            >
              {loading ? (
                <>
                  <LoaderCircle className="spin" size={17} /> กำลังวิเคราะห์...
                </>
              ) : (
                <>
                  <span className="button-icon">↗</span> เริ่มวิเคราะห์
                </>
              )}
            </button>
          </div>
          {error && <div className="error-state">{error}</div>}
          {result && <ResultCard result={result} image={preview} />}
        </section>
      </div>
    </div>
  );
}

const skeletonLines = [
  ["ear", "shoulder"],
  ["shoulder", "elbow"],
  ["elbow", "wrist"],
  ["shoulder", "hip"],
  ["hip", "knee"],
  ["knee", "ankle"],
];

function PoseImage({ image, landmarks }) {
  const [imageSize, setImageSize] = useState(null);
  const isVisiblePoint = (point) =>
    point &&
    Number.isFinite(point.x) &&
    Number.isFinite(point.y) &&
    point.x >= 0 &&
    point.x <= 1 &&
    point.y >= 0 &&
    point.y <= 1;
  const points = Object.entries(landmarks || {}).filter(([, point]) =>
    isVisiblePoint(point),
  );

  return (
    <div
      className="pose-image"
      style={
        imageSize
          ? { aspectRatio: `${imageSize.width} / ${imageSize.height}` }
          : undefined
      }
    >
      <img
        src={image}
        alt="Analyzed posture"
        onLoad={(event) =>
          setImageSize({
            width: event.currentTarget.naturalWidth,
            height: event.currentTarget.naturalHeight,
          })
        }
      />
      {imageSize && (
        <svg
          viewBox={`0 0 ${imageSize.width} ${imageSize.height}`}
          preserveAspectRatio="none"
          aria-label="Pose skeleton overlay"
        >
          {skeletonLines.map(
            ([from, to]) =>
              isVisiblePoint(landmarks?.[from]) &&
              isVisiblePoint(landmarks?.[to]) && (
                <line
                  key={`${from}-${to}`}
                  x1={landmarks[from].x * imageSize.width}
                  y1={landmarks[from].y * imageSize.height}
                  x2={landmarks[to].x * imageSize.width}
                  y2={landmarks[to].y * imageSize.height}
                  vectorEffect="non-scaling-stroke"
                />
              ),
          )}
          {points.map(([name, point]) => (
            <circle
              key={name}
              cx={point.x * imageSize.width}
              cy={point.y * imageSize.height}
              r="6"
              vectorEffect="non-scaling-stroke"
            >
              <title>{name.replaceAll("_", " ")}</title>
            </circle>
          ))}
        </svg>
      )}
      <span className="pose-label">
        จุดโครงร่าง {landmarks ? "พร้อมใช้งาน" : "ไม่พบ"}
      </span>
    </div>
  );
}

function ResultCard({ result, image }) {
  return (
    <div className="result-card">
      <div className="result-top">
        <div>
          <span className="eyebrow">ผลการวิเคราะห์</span>
          <h2>{result.posture_status}</h2>
        </div>
        <div className="result-score">
          <strong>{result.rula_score}</strong>
          <span>RULA / 7</span>
        </div>
      </div>
      <div className="result-grid">
        <div>
          <span className="eyebrow">ระดับความเสี่ยง</span>
          <strong className="risk-text">{result.risk_level}</strong>
        </div>
        <div>
          <span className="eyebrow">ระดับการดำเนินการ</span>
          <strong>
            {result.rula_score >= 7
              ? "ควรแก้ไขทันที"
              : result.rula_score >= 5
                ? "ควรปรับเร็ว ๆ นี้"
                : result.rula_score >= 3
                  ? "ควรตรวจสอบเพิ่มเติม"
                  : "ยอมรับได้"}
          </strong>
        </div>
      </div>
      <div className="angle-card">
        <span className="eyebrow">มุมข้อต่อ</span>
        <AnglePanel angles={result.angles} />
      </div>
      <p className="pose-side-note">
        วิเคราะห์จากด้าน
        {result.selected_side === "left"
          ? "ซ้าย"
          : result.selected_side === "right"
            ? "ขวา"
            : "ข้างที่ระบบตรวจพบ"}
      </p>
      <div className="recommendation">
        <span className="eyebrow">คำแนะนำ</span>
        <p>
          {result.recommendations?.[0] || "ควรรักษาท่าทางให้อยู่ในแนวสมดุล"}
        </p>
      </div>
      {image && <PoseImage image={image} landmarks={result.landmarks} />}
    </div>
  );
}
