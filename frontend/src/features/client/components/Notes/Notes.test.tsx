import { expect, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { test } from '../../../../../test-extend';

import Notes from './Notes';

/*
 * The <label> in Notes has no htmlFor/id, so getByLabelText will not find
 * the textarea. Query it by placeholder instead.
 */
const PLACEHOLDER = 'Enter notes here...';

/* =========================================================
   RENDERING
========================================================= */

test('renders the label and the textarea', async () => {
  const screen = await render(<Notes />);

  await expect.element(screen.getByText('Notes', { exact: true })).toBeVisible();
  await expect.element(screen.getByPlaceholder(PLACEHOLDER)).toBeVisible();
});

test('renders an empty textarea by default', async () => {
  const screen = await render(<Notes />);

  await expect.element(screen.getByPlaceholder(PLACEHOLDER)).toHaveValue('');
});

test('displays the provided value', async () => {
  const screen = await render(<Notes value="Existing notes" />);

  await expect.element(screen.getByPlaceholder(PLACEHOLDER)).toHaveValue('Existing notes');
});

test('updates the displayed value when the value prop changes', async () => {
  const screen = await render(<Notes value="First" />);

  await expect.element(screen.getByPlaceholder(PLACEHOLDER)).toHaveValue('First');

  await screen.rerender(<Notes value="Second" />);

  await expect.element(screen.getByPlaceholder(PLACEHOLDER)).toHaveValue('Second');
});

/* =========================================================
   EDITING
========================================================= */

test('calls onChange with the typed text', async () => {
  const onChange = vi.fn();

  const screen = await render(<Notes value="" onChange={onChange} />);

  await screen.getByPlaceholder(PLACEHOLDER).fill('Hello');

  expect(onChange).toHaveBeenCalledWith('Hello');
});

test('calls onChange with the full replacement text when a value already exists', async () => {
  const onChange = vi.fn();

  const screen = await render(<Notes value="abc" onChange={onChange} />);

  await screen.getByPlaceholder(PLACEHOLDER).fill('xyz');

  expect(onChange).toHaveBeenLastCalledWith('xyz');
});

test('calls onChange with an empty string when the text is cleared', async () => {
  const onChange = vi.fn();

  const screen = await render(<Notes value="abc" onChange={onChange} />);

  await screen.getByPlaceholder(PLACEHOLDER).fill('');

  expect(onChange).toHaveBeenLastCalledWith('');
});

test('does not throw when typing without an onChange handler', async () => {
  const screen = await render(<Notes value="" />);

  const textarea = screen.getByPlaceholder(PLACEHOLDER);

  await textarea.fill('Hello');

  // Controlled with no handler: the value stays as provided
  await expect.element(textarea).toHaveValue('');
});

/* =========================================================
   READ ONLY
========================================================= */

test('is editable by default', async () => {
  const screen = await render(<Notes />);

  const textarea = screen.getByPlaceholder(PLACEHOLDER);

  await expect.element(textarea).not.toHaveAttribute('readonly');
  await expect.element(textarea).toHaveClass('bg-white');
  await expect.element(textarea).not.toHaveClass('cursor-not-allowed');
});

test('is read only when readOnly is true', async () => {
  const screen = await render(<Notes value="Locked notes" readOnly />);

  const textarea = screen.getByPlaceholder(PLACEHOLDER);

  await expect.element(textarea).toHaveAttribute('readonly');
  await expect.element(textarea).toHaveValue('Locked notes');
});

test('uses the disabled styling when readOnly is true', async () => {
  const screen = await render(<Notes readOnly />);

  const textarea = screen.getByPlaceholder(PLACEHOLDER);

  await expect.element(textarea).toHaveClass('bg-gray-100');
  await expect.element(textarea).toHaveClass('cursor-not-allowed');
  await expect.element(textarea).not.toHaveClass('bg-white');
});
