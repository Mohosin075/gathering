import { Request, Response } from 'express';
import { UsereventServices } from './userevent.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import pick from '../../../shared/pick';
import { usereventFilterables } from './userevent.constants';
import { paginationFields } from '../../../interfaces/pagination';

const createUserevent = catchAsync(async (req: Request, res: Response) => {
  const usereventData = req.body;

  const result = await UsereventServices.createUserevent(
    req.user!,
    usereventData
  );

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Userevent created successfully',
    data: result,
  });
});

const updateUserevent = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const usereventData = req.body;

  const result = await UsereventServices.updateUserevent(id, usereventData);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Userevent updated successfully',
    data: result,
  });
});

const getSingleUserevent = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await UsereventServices.getSingleUserevent(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Userevent retrieved successfully',
    data: result,
  });
});

const getAllUserevents = catchAsync(async (req: Request, res: Response) => {
  const filterables = pick(req.query, usereventFilterables);
  const pagination = pick(req.query, paginationFields);

  const result = await UsereventServices.getAllUserevents(
    req.user!,
    filterables,
    pagination
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Userevents retrieved successfully',
    data: result,
  });
});

const deleteUserevent = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await UsereventServices.deleteUserevent(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Userevent deleted successfully',
    data: result,
  });
});

export const UsereventController = {
  createUserevent,
  updateUserevent,
  getSingleUserevent,
  getAllUserevents,
  deleteUserevent,
};