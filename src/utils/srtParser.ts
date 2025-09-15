export interface Subtitle {
  id: number;
  startTime: number;
  endTime: number;
  text: string;
}

// Convert SRT timestamp format (HH:MM:SS,mmm) to seconds
function parseTimestamp(timestamp: string): number {
  const [time, milliseconds] = timestamp.split(",");
  const [hours, minutes, seconds] = time.split(":").map(Number);

  return hours * 3600 + minutes * 60 + seconds + parseInt(milliseconds) / 1000;
}

// Parse SRT file content into subtitle objects
export function parseSRT(srtContent: string): Subtitle[] {
  const subtitles: Subtitle[] = [];
  const blocks = srtContent.trim().split(/\n\s*\n/);

  blocks.forEach((block) => {
    const lines = block.trim().split("\n");
    if (lines.length >= 3) {
      const id = parseInt(lines[0]);
      const timeLine = lines[1];
      const textLines = lines.slice(2);

      // Parse timestamp line (format: "00:00:05,838 --> 00:00:08,398")
      const [startStr, endStr] = timeLine.split(" --> ");
      const startTime = parseTimestamp(startStr);
      const endTime = parseTimestamp(endStr);

      // Join multiple text lines
      const text = textLines.join(" ");

      subtitles.push({
        id,
        startTime,
        endTime,
        text,
      });
    }
  });

  return subtitles;
}

// Find the current subtitle based on video time
export function getCurrentSubtitle(
  subtitles: Subtitle[],
  currentTime: number
): Subtitle | null {
  return (
    subtitles.find(
      (subtitle) =>
        currentTime >= subtitle.startTime && currentTime <= subtitle.endTime
    ) || null
  );
}
