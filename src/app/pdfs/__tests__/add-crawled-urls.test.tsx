import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PDFProcessing from "../page";
import { useCrawlRealtimeStore } from "@/stores/crawlRealtime";
import "@testing-library/jest-dom";
import { NavigationProvider } from "@/components/navigation/NavigationContext";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

jest.mock("@/lib/api/backend-client", () => ({
  backendAPI: {
    downloadPDFs: jest.fn(),
  },
}));

import { backendAPI } from "@/lib/api/backend-client";

beforeEach(() => {
  // Reset crawl store
  useCrawlRealtimeStore.getState().resetCrawlState();
  jest.clearAllMocks();
  // Mock alert
  window.alert = jest.fn();
});

it("adds crawled URLs, shows placeholders, and replaces them after successful download", async () => {
  const testUrl = "https://example.com/BAN TIN T4-2021 A4.pdf";
  // Seed realtime store with discovered url
  useCrawlRealtimeStore.getState().addDiscoveredUrls([testUrl]);

  // Mock successful backend response
  (backendAPI.downloadPDFs as jest.Mock).mockResolvedValueOnce({
    success: true,
    downloaded_count: 1,
    total_count: 1,
    files: [
      {
        filename: "BAN TIN T4-2021 A4.pdf",
        filepath: "uploads/BAN_TIN_T4-2021_A4.pdf",
        url: "https://example.com/BAN%20TIN%20T4-2021%20A4.pdf",
        size: 1234,
      },
    ],
    message: "OK",
  });

  render(
    <ThemeProvider>
      <NavigationProvider>
        <PDFProcessing />
      </NavigationProvider>
    </ThemeProvider>,
  );

  // Click Add to Processing button
  const addBtn = await screen.findByRole("button", { name: /Add to Processing/i });
  await userEvent.click(addBtn);

  // Placeholder (filename) should appear immediately with processing status
  const names = await screen.findAllByText("BAN TIN T4-2021 A4.pdf");
  expect(names.length).toBeGreaterThanOrEqual(1);
  expect(screen.getAllByText(/Processing/i).length).toBeGreaterThanOrEqual(1);
  // After backend resolves, completed status should appear
  await waitFor(() => expect(screen.getAllByText(/Completed/i).length).toBeGreaterThanOrEqual(1));
});

it("marks placeholders as error when backend reports failure", async () => {
  const testUrl = "https://example.com/BAN TIN ERROR.pdf";
  useCrawlRealtimeStore.getState().addDiscoveredUrls([testUrl]);

  // Mock backend to report failure
  (backendAPI.downloadPDFs as jest.Mock).mockResolvedValueOnce({
    success: false,
    downloaded_count: 0,
    total_count: 1,
    files: [
      {
        url: testUrl,
        error: "404 Not Found",
      },
    ],
    error: "Download failed",
    message: "Partial failure",
  });

  render(
    <ThemeProvider>
      <NavigationProvider>
        <PDFProcessing />
      </NavigationProvider>
    </ThemeProvider>,
  );

  const addBtn = await screen.findByRole("button", { name: /Add to Processing/i });
  await userEvent.click(addBtn);

  // Placeholder (filename) should appear immediately with processing status
  expect(await screen.findByText("BAN TIN ERROR.pdf")).toBeInTheDocument();
  expect(screen.getAllByText(/Processing/i).length).toBeGreaterThanOrEqual(1);
 
  // After backend responds with failure, placeholders should be marked as Error
  await waitFor(() => expect(screen.getAllByText(/Error/i).length).toBeGreaterThanOrEqual(1));
  // Alert should have been called for user notification
  expect(window.alert).toHaveBeenCalled();
});
