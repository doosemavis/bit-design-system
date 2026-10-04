import { expect, test } from "@playwright/test";
import { MODES, seedColorMode } from "./mode";

/** The computed width of the Foundations title's ::after bar, the title's own width, and the animation name. */
async function barState(page: import("@playwright/test").Page) {
  return page
    .getByRole("heading", { level: 2, name: "Foundations" })
    .evaluate((title) => {
      const bar = getComputedStyle(title, "::after");
      return {
        bar: parseFloat(bar.width),
        title: title.getBoundingClientRect().width,
        animation: bar.animationName,
      };
    });
}

test("reduced motion: the current section underline is full width with no animation", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("#/tokens");
  await expect(
    page.getByRole("heading", { level: 2, name: "Foundations" }),
  ).toBeVisible();
  const { bar, title, animation } = await barState(page);
  expect(animation).toBe("none");
  expect(bar).toBeCloseTo(title, 0);
});

test("the current section underline has filled the title once its animation ends", async ({
  page,
}) => {
  await page.goto("#/tokens");
  await expect(
    page.getByRole("heading", { level: 2, name: "Foundations" }),
  ).toBeVisible();
  await expect
    .poll(async () => {
      const { bar, title } = await barState(page);
      return Math.abs(bar - title) < 1;
    })
    .toBe(true);
});

test("a section that is not current keeps the 22px bar", async ({ page }) => {
  await page.goto("#/tokens");
  const width = await page
    .getByRole("heading", { level: 2, name: "Components" })
    .evaluate((title) => parseFloat(getComputedStyle(title, "::after").width));
  expect(width).toBe(22);
});

for (const mode of MODES) {
  test(`${mode} mode: the Foundations title is in the full text colour, not the muted shade`, async ({
    page,
  }) => {
    await seedColorMode(page, mode);
    await page.goto("#/tokens");
    await expect(page.locator("html")).toHaveAttribute("data-mode", mode);
    const { title, text } = await page
      .getByRole("heading", { level: 2, name: "Foundations" })
      .evaluate((el) => {
        // A probe resolves var(--bit-color-text) to the same computed form as the title's colour.
        const probe = document.createElement("span");
        probe.style.color = "var(--bit-color-text)";
        el.parentElement!.appendChild(probe);
        const text = getComputedStyle(probe).color;
        probe.remove();
        return { title: getComputedStyle(el).color, text };
      });
    expect(title).toBe(text);
  });
}
