const Order = require('../models/orderSchema');
const {User} = require('../models/userSchema');
const {Book}=require('../models/bookSchema')
const PDFDocument=require('pdfkit');
const ExcelJs=require('exceljs');
const fs=require('fs');
const path=require('path');
const bcrypt = require('bcrypt');

const loadLogin = (req, res) => {
    if (req.session.admin) {
        return res.redirect('/admin');
    }
    res.render('adminlogin', { message: null }); // Null instead of string 'null'
};

const login = async (req, res) => {
    try {
      const { email, password } = req.body;
      if(!email || !password){
        return res.status(400).json({ message: 'Please enter both email and password' });
      }
      const admin = await User.findOne({ email });
  
      if (!admin) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
  
      if (!admin.isAdmin) {
        return res.status(403).json({ success: false, message: 'You are not an admin' });
      }
  
      const passwordMatch = await bcrypt.compare(password, admin.password);
  
      if (!passwordMatch) {
        return res.status(401).json({ success: false, message: 'Incorrect password' });
      }
  
      req.session.admin = { id: admin._id, email: admin.email };
      console.log('Admin Logged In:', req.session.admin);
  
      return res.status(200).json({ success: true, redirect: '/admin' });
    } catch (error) {
      console.error('Error during login:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };
  


const adminLogout = (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Error during logout:', err);
        return res.redirect('/admin');
      }
  
      // Clear session cookie
      res.clearCookie('connect.sid', { path: '/' });
  
      // Respond with success or redirect
      res.redirect('/admin/login');
  
     
    });
  };

  const loadDashboard = async (req, res) => {
    if (!req.session.admin) {
      console.log("Admin session not found, redirecting to login.");
      return res.redirect('/admin/login');
    }
  
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = 5; // Number of records per page
      const skip = (page - 1) * limit;
      console.log("\n===== Fetching Dashboard Data =====\n");

      // Total Users
      const totalUsers = await User.countDocuments();
      console.log("Total Users:", totalUsers);

      // Total Books
      const totalBooks = await Book.countDocuments();
      console.log("Total Books:", totalBooks);

      // Total Orders
      const totalOrders = await Order.countDocuments();
      console.log("Total Orders:", totalOrders);

      // Delivered Orders
      const deliveredOrderedCount = await Order.countDocuments({ status: 'Delivered' });
      console.log("Total Delivered Orders:", deliveredOrderedCount);

      // Total Revenue Calculation
      const totalRevenue = await Order.aggregate([
        { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } }
      ]);
      const revenueAmount = totalRevenue.length > 0 ? totalRevenue[0].totalRevenue : 0;
      console.log("Total Revenue:", revenueAmount);

      // Fetching Orders (totalAmount, discountAmount, createdAt)
      const orders = await Order.find({}, "totalAmount discountAmount createdAt").populate("user");
      console.log("\n===== Orders Fetched =====");
      orders.forEach(order => {
        console.log({
          OrderID: order._id,
          TotalAmount: order.totalAmount,
          DiscountAmount: order.discountAmount || 0,
          CreatedAt: order.createdAt,
          User: order.user ? order.user._id : "No User Populated"
        });
      });

      // Total Sales Calculation
      const totalSales = orders.reduce((sum, order) => {
        console.log(`Processing Order ${order._id} - Total Amount: ${order.totalAmount}`);
        return sum + order.totalAmount;
      }, 0);
      console.log("Total Sales:", totalSales);

      // Total Discount Calculation
      const totalDiscount = orders.reduce((sum, order) => {
        console.log(`Processing Order ${order._id} - Discount Amount: ${order.discountAmount || 0}`);
        return sum + (order.discountAmount || 0);
      }, 0);
      console.log("Total Discount:", totalDiscount);

      // Date Calculations
      const today = new Date();
      const lastWeek = new Date();
      lastWeek.setDate(today.getDate() - 7);
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const firstDayOfYear = new Date(today.getFullYear(), 0, 1);

      console.log("\n===== Sales Aggregation =====");
      console.log("Today:", today);
      console.log("Last Week:", lastWeek);
      console.log("First Day of Month:", firstDayOfMonth);
      console.log("First Day of Year:", firstDayOfYear);

      const salesAggregation = async (startDate) => {
        const result = await Order.aggregate([
          { $match: { createdAt: { $gte: startDate } } },
          { $group: { _id: null, totalSales: { $sum: "$totalAmount" } } }
        ]);
        console.log(`Sales from ${startDate}:`, result);
        return result.length > 0 ? result[0].totalSales : 0;
      };

      const totalDailySales = await salesAggregation(today);
      console.log("Total Daily Sales:", totalDailySales);

      const totalWeeklySales = await salesAggregation(lastWeek);
      console.log("Total Weekly Sales:", totalWeeklySales);

      const totalMonthlySales = await salesAggregation(firstDayOfMonth);
      console.log("Total Monthly Sales:", totalMonthlySales);

      const totalYearlySales = await salesAggregation(firstDayOfYear);
      console.log("Total Yearly Sales:", totalYearlySales);

      // Report Data Based on Filters
      console.log("Query Parameters:", req.query); // Log the entire query object

      const filter = req.query.filter;
      let startDate = req.query.startDate;
      let endDate = req.query.endDate;

      console.log("\n===== Filter Data =====");
      console.log("Filter Type:", filter);
      console.log("Custom Start Date:", startDate);
      console.log("Custom End Date:", endDate);

      const reportData = await Order.find({
        createdAt: {
          $gte: startDate ? new Date(startDate) : new Date(0),
          $lte: endDate ? new Date(endDate) : new Date()
        }
      }).populate("user").skip(skip).limit(limit);
      const totalRecords = await Order.countDocuments({
        createdAt: {
          $gte: startDate ? new Date(startDate) : new Date(0),
          $lte: endDate ? new Date(endDate) : new Date()
        }
      });
      const totalPages = Math.ceil(totalRecords / limit); 

      console.log("\n===== Report Data =====");
      reportData.forEach(order => {
        console.log({
          OrderID: order._id,
          TotalAmount: order.totalAmount,
          DiscountAmount: order.discountAmount || 0,
          CreatedAt: order.createdAt,
          User: order.user ? order.user._id : "No User Populated"
        });
      });
      const dateFilter = {
        $match: {
          createdAt: {
            $gte: startDate ? new Date(startDate) : new Date(0),
            $lte: endDate ? new Date(endDate) : new Date()
          }
        }
      }
      const topProducts = await Order.aggregate([
        dateFilter,
        { $unwind: "$books" },
        {
            $group: {
                _id: "$books.productId",
                totalSales: { $sum: "$books.quantity" }
            }
        },
        { $sort: { totalSales: -1 } },
        { $limit: 10 },
        {
            $lookup: {
                from: "books",
                localField: "_id",
                foreignField: "_id",
                as: "bookDetails"
            }
        },
        { $unwind: "$bookDetails" },
        {
            $project: {
                title: "$bookDetails.title",
                totalSales: "$totalSales"
            }
        }
    ]);

    // Top Categories
    const topCategories = await Order.aggregate([
      dateFilter,
        { $unwind: "$books" },
        {
            $lookup: {
                from: "books",
                localField: "books.productId",
                foreignField: "_id",
                as: "bookDetails"
            }
        },
        { $unwind: "$bookDetails" },
        { $unwind: "$bookDetails.genres" },{
          $lookup:{
            from:"genres",
            localField:"bookDetails.genres",
            foreignField:"_id",
            as:"genreDetails"
          }
        },
        {
          $unwind:"$genreDetails"
        },

        {
            $group: {
                _id: "$genreDetails.name",
                totalSales: { $sum: "$books.quantity" }
            }
        },
        { $sort: { totalSales: -1 } },
        { $limit: 10 }
    ]);

    // Top Brands
    const topBrands = await Order.aggregate([
      dateFilter,
        { $unwind: "$books" },
        {
            $lookup: {
                from: "books",
                localField: "books.productId",
                foreignField: "_id",
                as: "bookDetails"
            }
        },
        { $unwind: "$bookDetails" },
        {
            $group: {
                _id: "$bookDetails.publisher",
                totalSales: { $sum: "$books.quantity" }
            }
        },
        { $sort: { totalSales: -1 } },
        { $limit: 10 }
    ]);
    console.log('Top',topCategories,topBrands,topProducts);
    const monthlySales = await Order.aggregate([
      {
          $group: {
              _id: { $month: "$createdAt" },
              totalSales: { $sum: "$totalAmount" }
          }
      },
      { $sort: { "_id": 1 } }
  ]);
    
      res.render('dashboard', {
        totalUsers, totalBooks, totalOrders, deliveredOrderedCount, totalRevenue,
        totalSales, totalDiscount, totalDailySales, totalWeeklySales, totalYearlySales,
        revenueAmount, totalMonthlySales, filter, startDate, endDate, reportData,
        currentPage: page,  
        totalPages: totalPages ,topProducts,topBrands,topCategories,monthlySales
      });

    } catch (error) {
      console.error("Error loading dashboard:", error);
      res.redirect("/pageNotFound");
    }
};

  
  const salesReport = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;  // Get page number from query, default is 1
        const limit = 10;
        const totalItems = await Order.countDocuments(); // Update this based on your model
const totalPages = Math.ceil(totalItems / limit);
      console.log("Fetching Sales Report...");
      console.log("Request Query Params:", req.query);
  
      const { filter, startDate, endDate, format } = req.query;
      let start, end;
      const today = new Date();
      today.setHours(0, 0, 0);
  
      switch (filter) {
        case 'daily':
          start = today;
          end = new Date(today);
          end.setHours(23, 59, 59, 999);
          break;
        case 'weekly':
          start = new Date(today);
          start.setDate(today.getDate() - 7);
          start.setHours(0, 0, 0, 0);
          end = new Date(today);
          end.setHours(23, 59, 59, 999);
          break;
        case 'monthly':
          start = new Date(today.getFullYear(), today.getMonth(), 1);
          start.setHours(0, 0, 0, 0);
          end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          end.setHours(23, 59, 59, 999);
          break;
        case 'yearly':
          start = new Date(today.getFullYear(), 0, 1);
          start.setHours(0, 0, 0, 0);
          end = new Date(today.getFullYear(), 11, 31);
          end.setHours(23, 59, 59, 999);
          break;
        case 'custom':
          if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Start date and end date are required for custom range' });
          }
      
          const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
          if (!isoDateRegex.test(startDate) || !isoDateRegex.test(endDate)) {
            return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
          }
      
          start = new Date(startDate);
          end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          break;
          default:
            start = new Date("2000-01-01"); // Default to earliest date
            end = new Date(); // Default to today
            break;
        
      }
      console.log("Received Filter:", filter);
      
  
      console.log("Final Start Date:", start);
      console.log("Final End Date:", end);
      console.log("Checking Start Date:", start.toISOString());
console.log("Checking End Date:", end.toISOString());
const statuses = await Order.distinct('status');
console.log("Available Order Statuses:", statuses);

  
      // const orders = await Order.find({ createdAt: { $gte: start, $lte: end }, status: 'Paid' }).populate('user');
      const orders = await Order.find({ 
        createdAt: { $gte: start, $lte: end }, 
        status: { $in: ['Paid', 'Delivered'] } 
      }).populate('user' )
      
      console.log("Filtered Orders:", orders);
  
      const reportData = orders.map(order => ({
        orderId: order.orderId || "N/A",
        customerName: order.user ? order.user.name : "Guest",
        payableAmount: order.totalAmount || 0.00,
        paymentMethod: order.paymentMethod || "Unknown",
        discount: order.discountAmount !== undefined ? order.discountAmount : 0.00,
        date: order.createdAt 
        ? new Date(order.createdAt).toLocaleDateString("en-IN") // Indian date format
        : "Unknown"
      }));
  
      console.log("Generated Report Data:", reportData);
  
      const totalSales = reportData.reduce((total, order) => total + order.payableAmount, 0);
      console.log("Total Sales:", totalSales);
  
      const totalDiscount = reportData.reduce((total, order) => total + order.discount, 0);
      console.log("Total Discount:", totalDiscount);
  
      const totalUsers = await User.countDocuments();
      console.log("Total Users:", totalUsers);
  
      const totalBooks = await Book.countDocuments();
      console.log("Total Books:", totalBooks);
  
      console.log("Export Format:", format);
  
      if (format === 'pdf') {
        const pdfPath = path.resolve(__dirname, '../Public/reports/salesReport.pdf');
        console.log("Generating PDF at:", pdfPath);
        generatePDF(reportData, totalSales, totalDiscount, pdfPath, res);
        return;
      } else if (format === 'excel') {
        const excelPath = path.join(__dirname, '../Public/reports/salesReport.xlsx');
        console.log("Generating Excel at:", excelPath);
        generateExcel(reportData, totalSales, totalDiscount, excelPath, res);
        return;
      }
      const dateFilter = {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      };
      
      const topProducts = await Order.aggregate([
        dateFilter,
        { $unwind: "$books" },
        {
            $group: {
                _id: "$books.productId",
                totalSales: { $sum: "$books.quantity" }
            }
        },
        { $sort: { totalSales: -1 } },
        { $limit: 10 },
        {
            $lookup: {
                from: "books",
                localField: "_id",
                foreignField: "_id",
                as: "bookDetails"
            }
        },
        { $unwind: "$bookDetails" },
        {
            $project: {
                title: "$bookDetails.title",
                totalSales: "$totalSales"
            }
        }
    ]);

    // Top Categories
    const topCategories = await Order.aggregate([
      dateFilter,
        { $unwind: "$books" },
        {
            $lookup: {
                from: "books",
                localField: "books.productId",
                foreignField: "_id",
                as: "bookDetails"
            }
        },
        { $unwind: "$bookDetails" },
        { $unwind: "$bookDetails.genres" },{
          $lookup:{
            from:"genres",
            localField:"bookDetails.genres",
            foreignField:"_id",
            as:"genreDetails"
          }
        },
        {
          $unwind:"$genreDetails"
        },

        {
            $group: {
                _id: "$genreDetails.name",
                totalSales: { $sum: "$books.quantity" }
            }
        },
        { $sort: { totalSales: -1 } },
        { $limit: 10 }
    ]);

    // Top Brands
    const topBrands = await Order.aggregate([
      dateFilter,
        { $unwind: "$books" },
        {
            $lookup: {
                from: "books",
                localField: "books.productId",
                foreignField: "_id",
                as: "bookDetails"
            }
        },
        { $unwind: "$bookDetails" },
        {
            $group: {
                _id: "$bookDetails.publisher",
                totalSales: { $sum: "$books.quantity" }
            }
        },
        { $sort: { totalSales: -1 } },
        { $limit: 10 }
    ]);const totalOrders = await Order.countDocuments();
    const deliveredOrderedCount = await Order.countDocuments({ status: 'Delivered' });
    const totalRevenue = await Order.aggregate([
      { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } }
    ]);
    const revenueAmount = totalRevenue.length > 0 ? totalRevenue[0].totalRevenue : 0;
      res.render('dashboard', { totalSales, totalDiscount, reportData, filter, totalUsers, totalBooks,startDate,endDate,topProducts,topBrands,topCategories ,dateFilter,totalOrders,deliveredOrderedCount,revenueAmount,currentPage:page,totalPages});
  
    } catch (error) {
      console.error("Error fetching sales report:", error);
      // res.status(500).json({ success: false, message: "Server error" });
      res.redirect('/pageNotFound')
    }
  };
  
  const generatePDF = (reportData, totalSales, totalDiscount, filePath, res) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });

    const dirPath = path.dirname(filePath);
    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Title Section
    doc.font('Helvetica-Bold').fontSize(24).text('Sales Report', { align: 'left' });

    // Format current date
    const formattedDate = new Date().toLocaleDateString('en-IN');

    // Add report date
    doc.font('Helvetica').fontSize(12).text(`Report Date: ${formattedDate}`, 50, doc.y + 10);
    doc.moveDown(3);

    // Adjusted Column Widths - Slightly reduced to ensure table fits on left side
    const columnWidths = [100, 100, 90, 70, 110, 80]; // Adjusted widths
    const headers = ['Order ID', 'Customer', 'Amount (₹)', 'Discount (₹)', 'Payment Method', 'Order Date'];
    const startX = 50; // Keep left margin consistent
    let startY = doc.y;

    // Table Header Background
    doc.rect(startX, startY, columnWidths.reduce((a, b) => a + b, 0), 30).fill('#2c3e50');
    doc.font('Helvetica-Bold').fontSize(12).fillColor('white');

    // Draw Table Headers
    headers.forEach((header, i) => {
        doc.text(header, startX + columnWidths.slice(0, i).reduce((a, b) => a + b, 0) + 5, startY + 10, {
            width: columnWidths[i] - 10,
            align: 'left'
        });
    });

    startY += 35;
    doc.fillColor('black').font('Helvetica').fontSize(10);

    // Table Rows
    reportData.forEach((order, rowIndex) => {
        if (startY + 30 > doc.page.height - 80) { 
            doc.addPage();
            startY = 50;

            // Redraw Headers on New Page
            doc.rect(startX, startY, columnWidths.reduce((a, b) => a + b, 0), 30).fill('#2c3e50');
            doc.font('Helvetica-Bold').fontSize(12).fillColor('white');
            headers.forEach((header, i) => {
                doc.text(header, startX + columnWidths.slice(0, i).reduce((a, b) => a + b, 0) + 5, startY + 10, {
                    width: columnWidths[i] - 10,
                    align: 'left'
                });
            });

            startY += 35;
            doc.fillColor('black').font('Helvetica').fontSize(10);
        }

        if (rowIndex % 2 === 0) {
            doc.rect(startX, startY - 5, columnWidths.reduce((a, b) => a + b, 0), 25).fill('#f8f9fa');
        }

        // Format Order Date
        // const orderDate = order.date ? new Date(order.date).toLocaleDateString('en-IN') : 'N/A';
// Format Order Date (Ensure consistency)
const parseDate = (dateStr) => {
  const parts = dateStr.split('/'); // Split the date
  if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      return `${day}/${month}/${year}`;
  }
  return 'N/A'; // Fallback for invalid dates
};

const orderDate = order.date ? parseDate(order.date) : 'N/A';
console.log("Formatted Order Date:", orderDate);

        // Adjusted Text Alignment
        const row = [
            order.orderId || 'N/A',
            order.customerName || 'Guest',
            `₹${order.payableAmount.toFixed(2)}`,
            `₹${order.discount.toFixed(2)}`,
            order.paymentMethod || 'Unknown',
            orderDate
        ];

        row.forEach((text, i) => {
            doc.fillColor('black').text(text, 
                startX + columnWidths.slice(0, i).reduce((a, b) => a + b, 0) + 5, 
                startY, {
                    width: columnWidths[i] - 10,
                    align: 'left'
                });
        });

        startY += 25;
    });

    // Add summary at the bottom
    doc.moveDown(2);
    doc.font('Helvetica-Bold').fontSize(12);
    doc.text(`Total Sales: ₹${totalSales.toFixed(2)}`, 50);
    doc.text(`Total Discount: ₹${totalDiscount.toFixed(2)}`, 50);

    doc.end();

    stream.on('finish', () => {
        res.download(filePath, 'salesReport.pdf');
    });
};





const generateExcel = async (reportData, totalSales, totalDiscount, filePath, res) => {
  const workbook = new ExcelJs.Workbook();
  const worksheet = workbook.addWorksheet('Sales Report');

  worksheet.columns = [
    { header: 'Order Id', key: 'orderId', width: 15 },
    { header: 'Customer', key: 'customerName', width: 20 },
    { header: 'Amount', key: 'payableAmount', width: 10 },
    { header: 'Discount', key: 'discount', width: 10 },
    { header: 'Payment Method', key: 'paymentMethod', width: 15 },
    { header: 'Date', key: 'date', width: 15 },
  ];

  reportData.forEach(order => worksheet.addRow(order));

  worksheet.addRow([]);
  worksheet.addRow(['Total Sales', totalSales]);
  worksheet.addRow(['Total Discount', totalDiscount]);

  await workbook.xlsx.writeFile(filePath);
  res.download(filePath, 'salesReport.xlsx');
};

module.exports = { loadLogin, login, loadDashboard ,adminLogout,salesReport};
