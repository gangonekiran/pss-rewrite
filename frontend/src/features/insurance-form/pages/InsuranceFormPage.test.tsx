import { afterEach, beforeEach, expect, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import toast from 'react-hot-toast';
import { AxiosError, AxiosHeaders } from 'axios';

import { test } from '../../../../test-extend';

import insuranceFormService from '../../../services/insurance-form.service';
import type { InsuranceFormOptions, InsuranceFormRecord } from '../../../types/insurance-form';

import InsuranceFormPage from './InsuranceFormPage';

/** Matches a field's label with or without the required "*" that Field / FieldGroup add. */
const field = (text: string) =>
  new RegExp(`^${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\*?$`);

vi.mock('../../../services/insurance-form.service', () => ({
  default: {
    get: vi.fn(),
    options: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

type Screen = Awaited<ReturnType<typeof render>>;

const client = {
  ChildID: 123,
  LastName: 'Austin',
  FirstName: 'Jane',
  SS: '123-45-6789',
  DOB: '2024-03-10T00:00:00.000Z',
};

const options: InsuranceFormOptions = {
  billingConsent: [
    { code: 1, label: 'My private insurance for services provided to my child.' },
    { code: 2, label: 'For services billed to Medicaid, I understand.' },
    { code: 3, label: 'I decline permission to bill my private insurance.' },
  ],
  declineReasons: [
    { field: 'DeclineReasonCap', label: 'My available life-time cap would be affected' },
    { field: 'DeclineReasonBenefits', label: 'My other health insurance benefits would decrease' },
    { field: 'DeclineReasonPremium', label: 'My health insurance premiums would increase' },
    {
      field: 'DeclineReasonEligibility',
      label: 'I risk loss of eligibility for me/my child for home and community waivers',
    },
  ],
};

const existing: InsuranceFormRecord = {
  ID: 7,
  FormDate: '2026-01-15 00:00:00',
  BranchAddress: 'Blue Cross',
  PolicyNumber: 'P-1',
  GroupNumber: 'G-1',
  GroupName: 'Acme',
  EffectiveDate: '2026-01-01 00:00:00',
  EndDate: '2026-12-31 00:00:00',
  PolicyHolder: 'Jane Austin',
  BillingConsent: 1,
  ParentSignatureDate: '2026-01-15 00:00:00',
  DeclineReasonCap: false,
  DeclineReasonPremium: false,
  DeclineReasonBenefits: false,
  DeclineReasonEligibility: false,
  ParentSignatureDate2: null,
};

const PRIVATE = /My private insurance/;
const MEDICAID = /billed to Medicaid/;
const DECLINE = /I decline permission/;

async function renderPage(formId?: number) {
  const onClose = vi.fn();
  const onSaved = vi.fn().mockResolvedValue(undefined);
  const screen = await render(
    <InsuranceFormPage childId={123} formId={formId} onClose={onClose} onSaved={onSaved} />,
  );
  return { screen, onClose, onSaved };
}

/* Radios are clicked through the DOM; coordinate clicks miss them in the scaled runner. */
async function check(radio: ReturnType<Screen['getByRole']>) {
  (radio.element() as HTMLInputElement).click();
  await expect.element(radio).toBeChecked();
}

async function fill(screen: Screen, label: string, value: string) {
  await page.elementLocator(screen.getByLabelText(field(label)).element()).fill(value);
}

async function clickButton(screen: Screen, name: string) {
  const button = screen.getByRole('button', { name, exact: true });
  await expect.element(button).toBeVisible();
  (button.element() as HTMLButtonElement).click();
}

const signatureDate = 'Parent or Guardian Signature Date';

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(insuranceFormService.get).mockResolvedValue({ client, forms: [existing] });
  vi.mocked(insuranceFormService.options).mockResolvedValue(options);
  vi.mocked(insuranceFormService.create).mockResolvedValue({});
  vi.mocked(insuranceFormService.update).mockResolvedValue({});
});

afterEach(() => {
  vi.restoreAllMocks();
});

test('new form: shows the three areas and only the child details', async () => {
  const { screen } = await renderPage();

  await expect.element(screen.getByRole('heading', { name: 'New Insurance Form' })).toBeVisible();
  for (const name of ['Client Information', 'Insurance Information', 'Consent to Bill Insurance']) {
    await expect.element(screen.getByRole('heading', { name, exact: true })).toBeVisible();
  }

  for (const text of ['Austin', 'Jane', '123-45-6789', '03/10/2024']) {
    await expect.element(screen.getByText(text, { exact: true })).toBeVisible();
  }
  expect(screen.getByText('Region', { exact: true }).elements()).toHaveLength(0);

  for (const label of [
    'Date Completed',
    'Insurance Company Name',
    'Policy #',
    'Group # (Contract #)',
    'Group/Employer Name',
    'Effective Date of Policy',
    'End Date of Policy',
    'Individual Policy Holder',
  ]) {
    await expect.element(screen.getByLabelText(field(label))).toHaveValue('');
  }
});

test('new form: no consent answer and no signature date until one is chosen', async () => {
  const { screen } = await renderPage();

  await expect.element(screen.getByRole('radio', { name: PRIVATE })).not.toBeChecked();
  expect(screen.getByLabelText(field(signatureDate)).elements()).toHaveLength(0);
  expect(screen.getByRole('radio', { name: /life-time cap/ }).elements()).toHaveLength(0);
});

test('only Date Completed is marked required until private billing is chosen', async () => {
  const { screen } = await renderPage();

  await expect.element(screen.getByText(/^Date Completed\s*\*$/)).toBeVisible();
  await expect.element(screen.getByText(/^Insurance Company Name$/)).toBeVisible();

  await check(screen.getByRole('radio', { name: PRIVATE }));

  await expect.element(screen.getByText(/^Insurance Company Name\s*\*$/)).toBeVisible();
});

test('Save without answers shows the errors and does not save', async () => {
  const { screen } = await renderPage();

  await clickButton(screen, 'Save');

  await expect.element(screen.getByText('Date Completed is required.')).toBeVisible();
  await expect.element(screen.getByText('Choose whether we may bill insurance.')).toBeVisible();
  expect(toast.error).toHaveBeenCalledWith('Please fix the highlighted fields.');
  expect(insuranceFormService.create).not.toHaveBeenCalled();
});

test('private billing requires the company name and signature date', async () => {
  const { screen } = await renderPage();

  await fill(screen, 'Date Completed', '2026-01-15');
  await check(screen.getByRole('radio', { name: PRIVATE }));
  await clickButton(screen, 'Save');

  await expect
    .element(screen.getByText('Insurance Company Name is required for private insurance billing.'))
    .toBeVisible();
  await expect
    .element(screen.getByText('Parent or Guardian Signature Date is required.'))
    .toBeVisible();
  expect(insuranceFormService.create).not.toHaveBeenCalled();
});

test('new form: saves private billing', async () => {
  const { screen, onSaved } = await renderPage();

  await fill(screen, 'Date Completed', '2026-01-15');
  await fill(screen, 'Insurance Company Name', 'Blue Cross');
  await fill(screen, 'Policy #', 'P-1');
  await fill(screen, 'Effective Date of Policy', '2026-01-01');
  await check(screen.getByRole('radio', { name: PRIVATE }));
  await fill(screen, signatureDate, '2026-01-15');
  await clickButton(screen, 'Save');

  await vi.waitFor(() => expect(insuranceFormService.create).toHaveBeenCalled());
  expect(insuranceFormService.create).toHaveBeenCalledWith(123, {
    FormDate: '2026-01-15',
    BranchAddress: 'Blue Cross',
    PolicyNumber: 'P-1',
    GroupNumber: null,
    GroupName: null,
    EffectiveDate: '2026-01-01',
    EndDate: null,
    PolicyHolder: null,
    BillingConsent: 1,
    ParentSignatureDate: '2026-01-15',
    DeclineReasonCap: false,
    DeclineReasonPremium: false,
    DeclineReasonBenefits: false,
    DeclineReasonEligibility: false,
    ParentSignatureDate2: null,
  });
  expect(toast.success).toHaveBeenCalledWith('Insurance Form saved successfully.');
  expect(onSaved).toHaveBeenCalled();
});

test('Medicaid billing does not need the company name', async () => {
  const { screen } = await renderPage();

  await fill(screen, 'Date Completed', '2026-01-15');
  await check(screen.getByRole('radio', { name: MEDICAID }));
  await fill(screen, signatureDate, '2026-01-15');
  await clickButton(screen, 'Save');

  await vi.waitFor(() => expect(insuranceFormService.create).toHaveBeenCalled());
  expect(vi.mocked(insuranceFormService.create).mock.calls[0][1]).toMatchObject({
    BranchAddress: null,
    BillingConsent: 2,
  });
});

test('decline: asks for one reason and its own signature date', async () => {
  const { screen } = await renderPage();

  await fill(screen, 'Date Completed', '2026-01-15');
  await check(screen.getByRole('radio', { name: DECLINE }));

  await expect.element(screen.getByRole('heading', { name: 'Decline' })).toBeVisible();
  for (const reason of options.declineReasons) {
    await expect.element(screen.getByRole('radio', { name: reason.label })).toBeVisible();
  }

  await clickButton(screen, 'Save');

  await expect.element(screen.getByText('Choose a reason.')).toBeVisible();
  await expect
    .element(screen.getByText('Parent or Guardian Signature Date is required.'))
    .toBeVisible();
  expect(insuranceFormService.create).not.toHaveBeenCalled();
});

test('decline: saves the chosen reason as its bit column', async () => {
  const { screen } = await renderPage();

  await fill(screen, 'Date Completed', '2026-01-15');
  await check(screen.getByRole('radio', { name: DECLINE }));
  await check(screen.getByRole('radio', { name: /premiums would increase/ }));
  await fill(screen, signatureDate, '2026-01-16');
  await clickButton(screen, 'Save');

  await vi.waitFor(() => expect(insuranceFormService.create).toHaveBeenCalled());
  expect(vi.mocked(insuranceFormService.create).mock.calls[0][1]).toMatchObject({
    BillingConsent: 3,
    ParentSignatureDate: null,
    DeclineReasonCap: false,
    DeclineReasonPremium: true,
    DeclineReasonBenefits: false,
    DeclineReasonEligibility: false,
    ParentSignatureDate2: '2026-01-16',
  });
});

test('switching from decline to Medicaid hides the decline reasons', async () => {
  const { screen } = await renderPage();

  await check(screen.getByRole('radio', { name: DECLINE }));
  await expect.element(screen.getByRole('radio', { name: /life-time cap/ })).toBeVisible();

  await check(screen.getByRole('radio', { name: MEDICAID }));

  await expect.element(screen.getByLabelText(field(signatureDate))).toBeVisible();
  expect(screen.getByRole('radio', { name: /life-time cap/ }).elements()).toHaveLength(0);
});

test('end date before the effective date shows an error', async () => {
  const { screen } = await renderPage();

  await fill(screen, 'Effective Date of Policy', '2026-02-01');
  await fill(screen, 'End Date of Policy', '2026-01-31');
  await clickButton(screen, 'Save');

  await expect
    .element(screen.getByText('End Date of Policy cannot be before Effective Date of Policy.'))
    .toBeVisible();
});

test('edit form: loads the record and saves changes with update', async () => {
  const { screen, onSaved } = await renderPage(7);

  await expect.element(screen.getByRole('heading', { name: 'Edit Insurance Form' })).toBeVisible();
  await expect.element(screen.getByLabelText(field('Date Completed'))).toHaveValue('2026-01-15');
  await expect.element(screen.getByLabelText(field('Insurance Company Name'))).toHaveValue('Blue Cross');
  await expect.element(screen.getByLabelText(field('End Date of Policy'))).toHaveValue('2026-12-31');
  await expect.element(screen.getByRole('radio', { name: PRIVATE })).toBeChecked();
  await expect.element(screen.getByLabelText(field(signatureDate))).toHaveValue('2026-01-15');

  await fill(screen, 'Policy #', 'P-2');
  await clickButton(screen, 'Save');

  await vi.waitFor(() => expect(insuranceFormService.update).toHaveBeenCalled());
  expect(insuranceFormService.update).toHaveBeenCalledWith(
    123,
    7,
    expect.objectContaining({ PolicyNumber: 'P-2', BillingConsent: 1 }),
  );
  expect(toast.success).toHaveBeenCalledWith('Insurance Form updated successfully.');
  expect(onSaved).toHaveBeenCalled();
});

test('edit form: shows a saved decline with its reason', async () => {
  vi.mocked(insuranceFormService.get).mockResolvedValue({
    client,
    forms: [
      {
        ...existing,
        BillingConsent: 3,
        ParentSignatureDate: null,
        DeclineReasonEligibility: true,
        ParentSignatureDate2: '2026-01-20',
      },
    ],
  });
  const { screen } = await renderPage(7);

  await expect.element(screen.getByRole('radio', { name: DECLINE })).toBeChecked();
  await expect.element(screen.getByRole('radio', { name: /home and community waivers/ })).toBeChecked();
  await expect.element(screen.getByLabelText(field(signatureDate))).toHaveValue('2026-01-20');
});

test('edit form: closes when the record is not found', async () => {
  const { onClose } = await renderPage(99);

  await vi.waitFor(() => expect(onClose).toHaveBeenCalled());
  expect(toast.error).toHaveBeenCalledWith('Insurance Form record not found.');
});

test('shows a message when the form cannot be loaded', async () => {
  vi.mocked(insuranceFormService.get).mockRejectedValue(new Error('Network Error'));
  const { screen } = await renderPage();

  await expect.element(screen.getByText('Insurance Form could not be loaded.')).toBeVisible();
  expect(toast.error).toHaveBeenCalledWith('Failed to load Insurance Form.');
});

test('shows the API message when saving fails', async () => {
  vi.mocked(insuranceFormService.update).mockRejectedValue(
    new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, undefined, {
      status: 400,
      statusText: 'Bad Request',
      headers: {},
      config: { headers: new AxiosHeaders() },
      data: { message: 'Date Completed cannot be before Date of Birth' },
    }),
  );
  const { screen, onSaved } = await renderPage(7);

  await expect.element(screen.getByLabelText(field('Date Completed'))).toHaveValue('2026-01-15');
  await clickButton(screen, 'Save');

  await vi.waitFor(() =>
    expect(toast.error).toHaveBeenCalledWith('Date Completed cannot be before Date of Birth'),
  );
  expect(onSaved).not.toHaveBeenCalled();
});

test('closes after saving when there is no onSaved callback', async () => {
  const onClose = vi.fn();
  const screen = await render(<InsuranceFormPage childId={123} formId={7} onClose={onClose} />);

  await expect.element(screen.getByLabelText(field('Date Completed'))).toHaveValue('2026-01-15');
  await clickButton(screen, 'Save');

  await vi.waitFor(() => expect(onClose).toHaveBeenCalled());
});

test('Cancel closes the form', async () => {
  const { screen, onClose } = await renderPage();

  await clickButton(screen, 'Cancel');

  expect(onClose).toHaveBeenCalled();
});
