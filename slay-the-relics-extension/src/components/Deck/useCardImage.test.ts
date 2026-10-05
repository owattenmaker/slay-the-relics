// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cardPreviewUrl, useCardImage } from "./useCardImage";

vi.mock("../../generated/card-previews.json", () => ({
  default: {
    sts1: Object.fromEntries(
      [
        "bashplus1",
        "decoded",
        "duplicate",
        "changing",
        "changingplus1",
        "next",
        "failure-download",
        "failure-decode",
      ].map((name) => [`${name}.png`, `data:image/webp;base64,${name}`]),
    ),
    sts2: {
      "strike_ironcladplusone.png": "data:image/webp;base64,sts2-upgrade",
      "hidden.png": "data:image/webp;base64,hidden",
    },
  },
}));

class MockImage {
  static requests: MockImage[] = [];
  src = "";
  onload?: () => void;
  onerror?: () => void;
  decode = vi.fn(() => Promise.resolve());
  constructor() {
    MockImage.requests.push(this);
  }
}

function request(url: string): MockImage {
  const image = MockImage.requests.find((image) => image.src === url);
  if (!image) throw new Error(`No request for ${url}`);
  return image;
}

async function flushImage(update: () => void) {
  await act(async () => {
    update();
    await Promise.resolve();
  });
}

beforeEach(() => {
  MockImage.requests = [];
  vi.stubGlobal("Image", MockImage);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("card previews", () => {
  it("maps both games and upgraded filenames to bundled WebP previews", () => {
    expect(cardPreviewUrl("https://example.com/bashplus1.png")).toBe(
      "data:image/webp;base64,bashplus1",
    );
    expect(
      cardPreviewUrl("https://example.com/strike_ironcladplusone.png", "sts2"),
    ).toBe("data:image/webp;base64,sts2-upgrade");
  });

  it("warms previews while hidden and downloads originals only when opened", () => {
    const url = "https://example.com/hidden.png";
    const { result, rerender } = renderHook(
      ({ visible }) => useCardImage(url, "sts2", visible),
      { initialProps: { visible: false } },
    );
    expect(result.current).toBe(cardPreviewUrl(url, "sts2"));
    expect(MockImage.requests.map((image) => image.src)).toEqual([
      result.current,
    ]);
    rerender({ visible: true });
    expect(request(url)).toBeDefined();
  });

  it("keeps the preview until the original has decoded, then reuses it on reopen", async () => {
    const url = "https://example.com/decoded.png";
    const { result, unmount } = renderHook(() =>
      useCardImage(url, "sts1", true),
    );
    let finishDecode!: () => void;
    request(url).decode.mockReturnValue(
      new Promise<void>((resolve) => {
        finishDecode = resolve;
      }),
    );
    await flushImage(() => {
      request(url).onload?.();
    });
    expect(result.current).toBe(cardPreviewUrl(url, "sts1"));
    await flushImage(() => {
      finishDecode();
    });
    expect(result.current).toBe(url);
    unmount();
    const reopened = renderHook(() => useCardImage(url, "sts1", true));
    expect(reopened.result.current).toBe(url);
    expect(
      MockImage.requests.filter((image) => image.src === url),
    ).toHaveLength(1);
  });

  it("shares in-flight requests between duplicate cards", async () => {
    const url = "https://example.com/duplicate.png";
    const first = renderHook(() => useCardImage(url, undefined, true));
    const second = renderHook(() => useCardImage(url, undefined, true));
    expect(MockImage.requests).toHaveLength(2);
    await flushImage(() => {
      request(url).onload?.();
    });
    expect(first.result.current).toBe(url);
    expect(second.result.current).toBe(url);
  });

  it("does not apply a late result to a different card or upgrade", async () => {
    const base = "https://example.com/changing.png";
    const upgrade = "https://example.com/changingplus1.png";
    const { result, rerender } = renderHook(
      ({ url }) => useCardImage(url, undefined, true),
      { initialProps: { url: base } },
    );
    rerender({ url: upgrade });
    await flushImage(() => {
      request(base).onload?.();
    });
    expect(result.current).toBe(cardPreviewUrl(upgrade));
    await flushImage(() => {
      request(upgrade).onload?.();
    });
    expect(result.current).toBe(upgrade);
    rerender({ url: "https://example.com/next.png" });
    expect(result.current).toBe(cardPreviewUrl("https://example.com/next.png"));
  });

  it.each(["download", "decode"])(
    "keeps previews after %s failure and retries on reopening",
    async (failure) => {
      const url = `https://example.com/failure-${failure}.png`;
      const { result, rerender } = renderHook(
        ({ visible }) => useCardImage(url, undefined, visible),
        { initialProps: { visible: true } },
      );
      await flushImage(() => {
        if (failure === "download") request(url).onerror?.();
        else {
          request(url).decode.mockRejectedValue(new Error("decode failed"));
          request(url).onload?.();
        }
      });
      expect(result.current).toBe(cardPreviewUrl(url));
      rerender({ visible: false });
      rerender({ visible: true });
      const attempts = MockImage.requests.filter((image) => image.src === url);
      expect(attempts).toHaveLength(2);
      await flushImage(() => {
        attempts[1].onload?.();
      });
      expect(result.current).toBe(url);
    },
  );

  it("still loads originals when a preview is missing", async () => {
    const url = "https://example.com/new-card.png";
    const { result } = renderHook(() => useCardImage(url, undefined, true));
    expect(result.current).toBe(url);
    expect(MockImage.requests).toHaveLength(1);
    await flushImage(() => {
      request(url).onload?.();
    });
    expect(result.current).toBe(url);
  });
});
