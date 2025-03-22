import { NextApiRequest, NextApiResponse } from 'next';
import ExcelJS from 'exceljs';
import supabase from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract query parameters
    const { studentId, sortBy = 'date', sortOrder = 'desc' } = req.query;
    
    console.log('Generating Excel report with params:', { studentId, sortBy, sortOrder });
    
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
    if (studentId && typeof studentId === 'string') {
      query = query.eq('user_id', studentId);
    }
    
    // Apply sorting based on the provided parameters
    if (typeof sortBy === 'string' && typeof sortOrder === 'string') {
      // Ensure sortOrder is either 'asc' or 'desc'
      const order = ['asc', 'desc'].includes(sortOrder.toLowerCase()) 
        ? sortOrder.toLowerCase() 
        : 'desc';
      
      query = query.order(sortBy, { ascending: order === 'asc' });
    } else {
      // Default sort by date in descending order (newest first)
      query = query.order('date', { ascending: false });
    }
    
    // Execute the query to get activities
    const { data: activities, error } = await query;
    
    if (error) {
      console.error('Error fetching activities:', error);
      return res.status(500).json({ error: 'Failed to fetch activities' });
    }
    
    if (!activities || activities.length === 0) {
      console.log('No activities found with the given criteria');
      // Return an empty Excel file rather than an error
    }
    
    // Get all user IDs from activities
    const userIds = activities ? activities.map(activity => activity.user_id) : [];
    const uniqueUserIds = [...new Set(userIds)];
    
    // Get user information from profiles table
    const { data: users, error: usersError } = await supabase
      .from('profiles') 
      .select('id, name, student_name') 
      .in('id', uniqueUserIds.length > 0 ? uniqueUserIds : ['no-users']);
    
    if (usersError) {
      console.error('Error fetching user data:', usersError);
      // Continue with limited information
    }
    
    // Create a mapping of user IDs to names
    const userNameMap: { [key: string]: string } = {};
    if (users && users.length > 0) {
      users.forEach(user => {
        const name = user.student_name || user.name || user.id;
        userNameMap[user.id] = name;
      });
    }
    
    // Create a new Excel workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Student Activities');
    
    // Define columns
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
    
    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' } // Light gray background
    };
    
    // Add data to the worksheet
    if (activities && activities.length > 0) {
      activities.forEach((activity: any) => {
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
      
      // Format the Points column as numbers
      worksheet.getColumn('points').numFmt = '0.00';
    } else {
      // Add a message if no activities found
      worksheet.addRow({
        studentId: 'No activities found',
        studentName: '',
        activityName: '',
        certificateType: '',
        issuer: '',
        date: '',
        points: '',
        description: '',
        fileUrl: ''
      });
    }
    
    try {
      // Generate Excel buffer
      const buffer = await workbook.xlsx.writeBuffer();
      
      // Set filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = studentId ? 
        `activities-student-${studentId}-${timestamp}.xlsx` : 
        `activities-all-students-${timestamp}.xlsx`;
      
      // Set response headers for file download
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      // Send the Excel file
      return res.status(200).send(buffer);
    } catch (excelError) {
      console.error('Error generating Excel buffer:', excelError);
      return res.status(500).json({ error: 'Failed to generate Excel file' });
    }
    
  } catch (err :any) {
    console.error('Error in generate-excel API route:', err);
    return res.status(500).json({ 
      error: 'Failed to generate Excel report',
      details: err.message
    });
  }
}