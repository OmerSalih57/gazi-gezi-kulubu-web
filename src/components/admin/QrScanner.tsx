"use client";

import { useRef, useState } from "react";
import { Scanner, useDevices, type IScannerError } from "@yudiel/react-qr-scanner";

interface QrScannerProps {
  eventId: string;
  onScanSuccess?: () => void;
}

type ScanResult = {
  status: "ok" | "already" | "invalid" | "unauthorized" | "forbidden" | "error";
  name?: string;
  message?: string;
};

function cameraErrorMessage(error: IScannerError) {
  switch (error.kind) {
    case "permission-denied":
      return "Kamera izni verilmedi. Tarayıcı ayarlarından kameraya izin verin veya aşağıdaki elle aramayı kullanın.";
    case "no-camera":
      return "Bu cihazda kamera bulunamadı. Elle arama ile yoklama alabilirsiniz.";
    case "in-use":
      return "Kamera başka bir uygulama tarafından kullanılıyor.";
    case "overconstrained":
      return "Seçilen kamera açılamadı. Listeden başka bir kamera deneyin.";
    case "insecure-context":
      return "Kamera yalnızca güvenli (HTTPS veya localhost) bağlantıda açılır.";
    default:
      return error.message || "Kamera başlatılamadı.";
  }
}

export function QrScanner({ eventId, onScanSuccess }: QrScannerProps) {
  const [result, setResult] = useState<ScanResult | null>(null);
  const [deviceId, setDeviceId] = useState("");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const devices = useDevices();
  const busy = useRef(false);

  const constraints: MediaTrackConstraints = deviceId
    ? { deviceId: { exact: deviceId } }
    : { facingMode: { ideal: "environment" } };

  const handleScan = async (codes: { rawValue: string }[]) => {
    if (busy.current || !codes[0]?.rawValue) return;
    busy.current = true;

    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: codes[0].rawValue, eventId }),
      });

      const data: ScanResult = await res.json();
      setResult(data);

      if (data.status === "ok" && onScanSuccess) {
        onScanSuccess();
      }
    } catch {
      setResult({
        status: "error",
        message: "Sunucuyla bağlantı kurulamadı.",
      });
    } finally {
      setTimeout(() => {
        busy.current = false;
      }, 2000);
    }
  };

  const getTone = () => {
    if (!result) return "";
    if (result.status === "ok") return "bg-emerald-600 border-emerald-700 text-white";
    if (result.status === "already") return "bg-amber-500 border-amber-600 text-white";
    return "bg-rose-600 border-rose-700 text-white";
  };

  return (
    <div className="mx-auto max-w-md space-y-4 text-left">
      <label className="block space-y-1.5">
        <span className="text-xs font-semibold text-neutral-600">Kamera</span>
        <select
          value={deviceId}
          onChange={(event) => {
            setCameraError(null);
            setDeviceId(event.target.value);
          }}
          className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 outline-none focus:border-orange-500"
        >
          <option value="">Otomatik (mobilde arka kamera)</option>
          {devices
            .filter((device) => device.deviceId)
            .map((device, index) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label?.trim() || `Kamera ${index + 1}`}
              </option>
            ))}
        </select>
        <span className="block text-[11px] text-neutral-400">
          Telefonlarda varsayılan seçim arka kamerayı açar. İzin verildikten sonra liste dolar.
        </span>
      </label>

      <div className="overflow-hidden rounded-2xl border-2 border-neutral-300 shadow-md bg-black relative aspect-square">
        <Scanner
          key={deviceId || "environment"}
          onScan={handleScan}
          onError={(error) => setCameraError(cameraErrorMessage(error))}
          constraints={constraints}
          formats={["qr_code"]}
        />
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="size-48 border-2 border-dashed border-white/60 rounded-xl" />
        </div>
      </div>

      {cameraError && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {cameraError}
        </p>
      )}

      {result && (
        <div className={`p-4 rounded-xl border text-center font-bold text-sm shadow-md transition-all ${getTone()}`}>
          <div>
            {result.status === "ok" && "✓ GİRİŞ BAŞARILI"}
            {result.status === "already" && "⚠️ DAHA ÖNCE GİRİŞ YAPILMIŞ"}
            {(result.status === "invalid" || result.status === "error") && "✕ GEÇERSİZ BİLET"}
          </div>
          <div className="text-xs font-normal mt-1 opacity-90">{result.message || result.name}</div>
        </div>
      )}
    </div>
  );
}

export default QrScanner;
