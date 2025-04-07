import Lead from '../models/Lead.js';
import User from '../models/User.js';
import asyncHandler from '../middleware/async.js';
import ErrorResponse from '../utils/errorResponse.js';

// @desc    Get all leads
// @route   GET /api/leads
// @access  Private
export const getLeads = asyncHandler(async (req, res, next) => {
  let query;
  
  // Telecallers can only see their leads, admin can see all
  if (req.user.role === 'telecaller') {
    query = Lead.find({ telecaller: req.user.id });
  } else {
    query = Lead.find().populate('telecaller', 'name email');
  }

  const leads = await query.sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: leads.length,
    data: leads,
  });
});

// @desc    Get single lead
// @route   GET /api/leads/:id
// @access  Private
export const getLead = asyncHandler(async (req, res, next) => {
  const lead = await Lead.findById(req.params.id).populate('telecaller', 'name email');

  if (!lead) {
    return next(
      new ErrorResponse(`Lead not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is lead owner or admin
  if (lead.telecaller._id.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to access this lead`,
        401
      )
    );
  }

  res.status(200).json({
    success: true,
    data: lead,
  });
});

// @desc    Create new lead
// @route   POST /api/leads
// @access  Private (Telecaller only)
export const createLead = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.telecaller = req.user.id;
  
  // Only telecallers can create leads
  if (req.user.role !== 'telecaller') {
    return next(
      new ErrorResponse(`User ${req.user.id} is not authorized to create leads`, 401)
    );
  }

  const lead = await Lead.create(req.body);

  res.status(201).json({
    success: true,
    data: lead,
  });
});

// @desc    Update lead
// @route   PUT /api/leads/:id
// @access  Private (Telecaller only)
export const updateLead = asyncHandler(async (req, res, next) => {
  let lead = await Lead.findById(req.params.id);

  if (!lead) {
    return next(
      new ErrorResponse(`Lead not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is lead owner
  if (lead.telecaller.toString() !== req.user.id) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this lead`,
        401
      )
    );
  }

  // Only allow address to be updated
  const { address } = req.body;
  lead = await Lead.findByIdAndUpdate(req.params.id, { address }, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: lead,
  });
});

// @desc    Update lead status
// @route   PUT /api/leads/:id/status
// @access  Private (Telecaller only)
export const updateLeadStatus = asyncHandler(async (req, res, next) => {
  let lead = await Lead.findById(req.params.id);

  if (!lead) {
    return next(
      new ErrorResponse(`Lead not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is lead owner
  if (lead.telecaller.toString() !== req.user.id) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this lead`,
        401
      )
    );
  }

  const { status, response } = req.body;
  
  // Update call date if status is changing to connected
  const callDate = status === 'connected' ? Date.now() : lead.callDate;
  
  lead = await Lead.findByIdAndUpdate(
    req.params.id,
    { status, response, callDate },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    success: true,
    data: lead,
  });
});

// @desc    Delete lead
// @route   DELETE /api/leads/:id
// @access  Private (Telecaller only)
export const deleteLead = asyncHandler(async (req, res, next) => {
  const lead = await Lead.findById(req.params.id);

  if (!lead) {
    return next(
      new ErrorResponse(`Lead not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is lead owner
  if (lead.telecaller.toString() !== req.user.id) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to delete this lead`,
        401
      )
    );
  }

  await Lead.deleteOne({ _id: req.params.id });

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Get call statistics for dashboard
// @route   GET /api/leads/stats
// @access  Private (Admin only)
export const getLeadStats = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'admin') {
    return next(
      new ErrorResponse(`User ${req.user.id} is not authorized to access this route`, 401)
    );
  }

  // Get total telecallers
  const totalTelecallers = await User.countDocuments({ role: 'telecaller' });

  // Get total calls made (connected)
  const totalCalls = await Lead.countDocuments({ status: 'connected' });

  // Get total customers contacted (connected or not connected)
  const totalCustomers = await Lead.countDocuments({
    status: { $in: ['connected', 'not connected'] },
  });

  // Get recent connected calls
  const recentCalls = await Lead.find({ status: 'connected' })
    .sort({ callDate: -1 })
    .limit(10)
    .populate('telecaller', 'name');

  // Get call trends for the past week
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  const callTrends = await Lead.aggregate([
    {
      $match: {
        status: 'connected',
        callDate: { $gte: oneWeekAgo },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$callDate' } },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalTelecallers,
      totalCalls,
      totalCustomers,
      recentCalls,
      callTrends,
    },
  });
});