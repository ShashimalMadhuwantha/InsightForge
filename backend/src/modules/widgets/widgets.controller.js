const widgetsService = require('./widgets.service');

/**
 * Widgets Controller (Epic 6 Task 6.3)
 */

async function listWidgets(req, res, next) {
  try {
    const tenantId = req.user.tenant_id;
    const { page, limit, search, dataSourceId, type } = req.query;

    const result = await widgetsService.listWidgets(tenantId, {
      page,
      limit,
      search,
      dataSourceId,
      type,
    });

    return res.status(200).json({
      success: true,
      data: result.widgets,
      pagination: result.pagination,
    });
  } catch (err) {
    return next(err);
  }
}

async function getWidgetById(req, res, next) {
  try {
    const tenantId = req.user.tenant_id;
    const { id } = req.params;

    const widget = await widgetsService.getWidgetById(tenantId, id);

    return res.status(200).json({
      success: true,
      data: widget,
    });
  } catch (err) {
    return next(err);
  }
}

async function createWidget(req, res, next) {
  try {
    const tenantId = req.user.tenant_id;
    const widget = await widgetsService.createWidget(tenantId, req.body, req.user);

    return res.status(201).json({
      success: true,
      data: widget,
      message: 'Widget created successfully',
    });
  } catch (err) {
    return next(err);
  }
}

async function updateWidget(req, res, next) {
  try {
    const tenantId = req.user.tenant_id;
    const { id } = req.params;

    const widget = await widgetsService.updateWidget(tenantId, id, req.body);

    return res.status(200).json({
      success: true,
      data: widget,
      message: 'Widget updated successfully',
    });
  } catch (err) {
    return next(err);
  }
}

async function deleteWidget(req, res, next) {
  try {
    const tenantId = req.user.tenant_id;
    const { id } = req.params;

    const result = await widgetsService.deleteWidget(tenantId, id);

    return res.status(200).json({
      success: true,
      data: result,
      message: 'Widget deleted successfully',
    });
  } catch (err) {
    return next(err);
  }
}

async function executeWidgetQuery(req, res, next) {
  try {
    const tenantId = req.user.tenant_id;
    const result = await widgetsService.executeWidgetQuery(tenantId, req.body);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    return next(err);
  }
}

async function getSuggestions(req, res, next) {
  try {
    const tenantId = req.user.tenant_id;
    const { dataSourceId } = req.params;

    const result = await widgetsService.getSuggestions(tenantId, dataSourceId);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listWidgets,
  getWidgetById,
  createWidget,
  updateWidget,
  deleteWidget,
  executeWidgetQuery,
  getSuggestions,
};
