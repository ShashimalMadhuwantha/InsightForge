import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { DataSourceUploadPage } from '../DataSourceUploadPage';
import { dataSourceService } from '../../../services/dataSourceService';

function renderWithRouter(ui) {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}

describe('DataSourceUploadPage Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders upload dropzone area and form elements', () => {
    renderWithRouter(<DataSourceUploadPage />);

    expect(screen.getByTestId('dropzone-area')).toBeInTheDocument();
    expect(screen.getByTestId('dataset-name-input')).toBeInTheDocument();
    expect(screen.getByTestId('submit-upload-btn')).toBeInTheDocument();
  });

  it('shows error message when unsupported file extension is selected', async () => {
    renderWithRouter(<DataSourceUploadPage />);

    const badFile = new File(['bad content'], 'script.py', { type: 'text/x-python' });
    const fileInput = screen.getByTestId('file-input');

    fireEvent.change(fileInput, { target: { files: [badFile] } });

    await waitFor(() => {
      expect(screen.getByTestId('upload-error-alert')).toHaveTextContent(/Unsupported file format/i);
    });
  });

  it('uploads valid CSV file and begins ingestion flow', async () => {
    vi.spyOn(dataSourceService, 'uploadDataSource').mockResolvedValueOnce({
      data: { id: 'ds-test-123' },
    });
    vi.spyOn(dataSourceService, 'getDataSourceStatus').mockResolvedValueOnce({
      data: { id: 'ds-test-123', status: 'ready' },
    });

    renderWithRouter(<DataSourceUploadPage />);

    const validFile = new File(['id,name\n1,Alpha\n'], 'sales.csv', { type: 'text/csv' });
    const fileInput = screen.getByTestId('file-input');

    fireEvent.change(fileInput, { target: { files: [validFile] } });

    await waitFor(() => {
      expect(screen.getByDisplayValue('sales')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('submit-upload-btn'));

    await waitFor(() => {
      expect(dataSourceService.uploadDataSource).toHaveBeenCalled();
    });
  });
});
