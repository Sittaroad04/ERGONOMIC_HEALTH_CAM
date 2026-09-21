import { useEffect, useRef, useState } from "react";
import { Camera as CameraIcon, CameraOff, Circle, Radio } from "lucide-react";

const skeletonLines = [
  ["ear", "shoulder"],
  ["shoulder", "elbow"],
  ["elbow", "wrist"],
  ["shoulder", "hip"],
  ["hip", "knee"],
  ["knee", "ankle"],
];

export default function Camera({ active, onFrame, onCapture, onError, view, landmarks }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState("");
  const [error, setError] = useState("");
  const [cameraReady, setCameraReady] = useState(false);
  const [videoSize, setVideoSize] = useState(null);
  useEffect(() => {
    navigator.mediaDevices?.enumerateDevices().then((items) => {
      const cameras = items.filter((item) => item.kind === "videoinput");
      setDevices(cameras);
      if (!deviceId && cameras[0]) setDeviceId(cameras[0].deviceId);
    });
  }, [active, deviceId]);
  const isVisiblePoint = (point) =>
    point &&
    Number.isFinite(point.x) &&
    Number.isFinite(point.y) &&
    point.x >= 0 &&
    point.x <= 1 &&
    point.y >= 0 &&
    point.y <= 1;

  useEffect(() => {
    let stream;
    async function start() {
      if (!active) return;
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("This browser does not support camera access");
      }
      stream = await navigator.mediaDevices.getUserMedia({
        video: deviceId ? { deviceId: { exact: deviceId } } : true,
      });
      setError("");
      setCameraReady(true);
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      stream.getVideoTracks().forEach((track) => {
        track.onended = () => {
          setCameraReady(false);
          const message = "Camera stopped or was disconnected";
          setError(message);
          onError?.(message);
        };
      });
    }
    start().catch((reason) => {
      const message = reason.name === "NotAllowedError"
        ? "Camera access was denied. Please allow it in browser settings"
        : reason.message || "Unable to start camera";
      setError(message);
      setCameraReady(false);
      onError?.(message);
    });
    return () => {
      setCameraReady(false);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [active, deviceId, onError]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handleLoadedMetadata = () => {
      setVideoSize({
        width: video.videoWidth,
        height: video.videoHeight,
      });
    };
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    if (video.readyState >= 1) {
      handleLoadedMetadata();
    }
    return () => video.removeEventListener('loadedmetadata', handleLoadedMetadata);
  }, [cameraReady]);
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video?.videoWidth) return;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d").drawImage(video, 0, 0);
      onFrame(canvas.toDataURL("image/jpeg", 0.55));
    }, 100);
    return () => clearInterval(timer);
  }, [active, onFrame]);
  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video?.videoWidth) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    onCapture?.(canvas.toDataURL("image/jpeg", 0.85));
  };
  const points = Object.entries(landmarks || {}).filter(([, point]) =>
    isVisiblePoint(point),
  );

  console.log("Camera landmarks:", landmarks);
  console.log("Video size:", videoSize);
  console.log("Visible points:", points);

  return (
    <div className="camera-frame">
      <video ref={videoRef} muted playsInline />
      <canvas ref={canvasRef} hidden />
      {videoSize && landmarks && (
        <svg
          className="pose-overlay"
          viewBox={`0 0 ${videoSize.width} ${videoSize.height}`}
          preserveAspectRatio="none"
          aria-label="Pose skeleton overlay"
        >
          {skeletonLines.map(
            ([from, to]) =>
              isVisiblePoint(landmarks?.[from]) &&
              isVisiblePoint(landmarks?.[to]) && (
                <line
                  key={`${from}-${to}`}
                  x1={landmarks[from].x * videoSize.width}
                  y1={landmarks[from].y * videoSize.height}
                  x2={landmarks[to].x * videoSize.width}
                  y2={landmarks[to].y * videoSize.height}
                  vectorEffect="non-scaling-stroke"
                />
              ),
          )}
          {points.map(([name, point]) => (
            <circle
              key={name}
              cx={point.x * videoSize.width}
              cy={point.y * videoSize.height}
              r="6"
              vectorEffect="non-scaling-stroke"
            >
              <title>{name.replaceAll("_", " ")}</title>
            </circle>
          ))}
        </svg>
      )}
      {!active && (
        <div className="camera-empty-state">
          <CameraOff size={34} />
          <strong>Camera is off</strong>
          <span>กด Start Camera เพื่อเริ่มตรวจท่านั่ง</span>
        </div>
      )}
      {error && <div className="error-state camera-error">{error}</div>}
      <div className="camera-meta">
        <span>
          <CameraIcon size={15} />{" "}
          {active && cameraReady ? "Camera is running" : active ? "Camera unavailable" : "Ready to start"}
        </span>
        {active && cameraReady && (
          <span className="live">
            <Radio size={14} /> Live feed
          </span>
        )}
      </div>
      <div className="camera-controls">
        <label>
          Camera
          <select value={deviceId} onChange={(event) => setDeviceId(event.target.value)}>
            {devices.length === 0 && <option value="">Default camera</option>}
            {devices.map((device, index) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `กล้อง ${index + 1}`}
              </option>
            ))}
          </select>
        </label>
        <span>View: {view === "back" ? "Back" : "Side"}</span>
        {active && <button type="button" title="Capture a still image" onClick={capture}><Circle size={17} /> Capture</button>}
      </div>
      {active && cameraReady && <div className="scan-line" />}
    </div>
  );
}
