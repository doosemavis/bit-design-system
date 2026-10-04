import { expect, test } from "@playwright/test";

test("Getting started: the step 4 toggle keeps its own size instead of stretching", async ({
  page,
}) => {
  await page.goto("#/getting-started");
  await expect(
    page.getByRole("heading", { level: 2, name: "Light and dark" }),
  ).toBeVisible();
  // The header has a Color mode toggle too; the step's one comes last on the page.
  const toggle = page.getByRole("group", { name: "Color mode" }).last();
  const toggleWidth = (await toggle.boundingBox())!.width;
  const mainWidth = (await page.getByRole("main").boundingBox())!.width;
  expect(toggleWidth).toBeLessThan(mainWidth / 2);
});

test("Getting started: the step 4 disclosure button keeps its own size instead of stretching", async ({
  page,
}) => {
  await page.goto("#/getting-started");
  const button = page.getByRole("button", {
    name: "Optional: use a saved choice before the page draws",
  });
  await expect(button).toBeVisible();
  const buttonWidth = (await button.boundingBox())!.width;
  const mainWidth = (await page.getByRole("main").boundingBox())!.width;
  expect(buttonWidth).toBeLessThan(mainWidth / 2);
});
