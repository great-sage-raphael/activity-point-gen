import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import supabase from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    // Extract query parameters
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');
    const sortBy = searchParams.get('sortBy') || 'date';
    const fromYear = searchParams.get('fromYear');
    const toYear = searchParams.get('toYear');
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    console.log('Generating Excel report with params:', { studentId, sortBy, fromYear, toYear, sortOrder });

    // Query for approved activities
    let query = supabase
      .from('activities')
      .select(`
        id,
        user_id,
        activity_name,
        certificate_type,
        issuer,
        date,
        points,
        status,
        description,
        file_url,
        profiles!activities_user_id_fkey(id, role)
      `)
      .eq('status', 'approved');

    // Filter by student if studentId is provided
    if (studentId) {
      query = query.eq('user_id', studentId);
    }

    // Filter by year range if both fromYear and toYear are provided
    if (fromYear && toYear) {
      query = query
        .gte('date', `01-01-${fromYear}`)
        .lte('date', `12-31-${toYear}`);
    }

    // Apply sorting based on the provided parameters
    const order = ['asc', 'desc'].includes(sortOrder.toLowerCase()) ? sortOrder.toLowerCase() : 'desc';
    query = query.order(sortBy, { ascending: order === 'asc' });

    // Execute the query to get activities
    const { data: activities, error } = await query;

    if (error) {
      console.error('Error fetching activities:', error);
      return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
    }

    // Get user information from profiles table
    const userIds = activities.map((activity) => activity.user_id);
    const uniqueUserIds = [...new Set(userIds)];

    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, name, student_name')
      .in('id', uniqueUserIds.length > 0 ? uniqueUserIds : ['no-users']);

    if (usersError) {
      console.error('Error fetching user data:', usersError);
    }

    // Create a user name mapping
    const userNameMap: { [key: string]: string } = {};
    users?.forEach((user) => {
      userNameMap[user.id] = user.student_name || user.name || user.id;
    });

    // Create a new Excel workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Student Activities');

    worksheet.columns = [
      { header: 'Student ID', key: 'studentId', width: 20 },
      { header: 'Student Name', key: 'studentName', width: 20 },
      { header: 'Activity Name', key: 'activityName', width: 30 },
      { header: 'Certificate Type', key: 'certificateType', width: 20 },
      { header: 'Issuer', key: 'issuer', width: 20 },
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Points', key: 'points', width: 10 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'File URL', key: 'fileUrl', width: 30 }
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' }
    };

    activities.forEach((activity) => {
      worksheet.addRow({
        studentId: activity.user_id,
        studentName: userNameMap[activity.user_id] || 'Unknown',
        activityName: activity.activity_name,
        certificateType: activity.certificate_type,
        issuer: activity.issuer,
        date: activity.date,
        points: activity.points,
        description: activity.description,
        fileUrl: activity.file_url
      });
    });

    // Generate Excel buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Create a response with Excel file download
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="activities-${studentId || 'all'}.xlsx"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error: any) {
    console.error('Error generating Excel:', error);
    return NextResponse.json({ error: 'Failed to generate Excel report', details: error.message }, { status: 500 });
  }
}