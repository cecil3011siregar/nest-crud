import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, Query, Put, UseGuards, Req } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(@Req() req, @Body() createDepartmentDto: CreateDepartmentDto) {
    return {
      data: await this.departmentsService.create(req.user.id, createDepartmentDto),
      statusCode: HttpStatus.CREATED,
      message: 'Success'
    }
  }

  @Get()
  async findAll(@Query('page') page: number, @Query('page_size') page_size: number) {
    return {
        data: await this.departmentsService.findAll(page, page_size),
        statusCode: HttpStatus.OK,
        message: 'Success'
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return {
      data: await this.departmentsService.findOneDept(id),
      statusCode: HttpStatus.OK,
      message: 'Success'
  }
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDepartmentDto: UpdateDepartmentDto) {
    return {
      data: await this.departmentsService.update(id, updateDepartmentDto),
      statusCode: HttpStatus.OK,
      message: 'Success'
  }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return {
      data: await this.departmentsService.remove(id),
      statusCode: HttpStatus.OK,
      message: 'Success'
  }
  }
}
