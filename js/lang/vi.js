// lang/vi.js - Vietnamese language file
window.TreeApp = window.TreeApp || {};
window.TreeApp.lang = window.TreeApp.lang || {};

window.TreeApp.lang.vi = {
  app_title: "BuildFolderTogether - Tạo cây thư mục",
  app_hint: "Kéo thả để di chuyển. Click chọn, Ctrl/Cmd+click chọn nhiều, chuột phải để mở menu. Ctrl+Z/Y hoàn tác/làm lại, Ctrl+X/C/V cắt/copy/dán, Ctrl+D nhân bản.",
  search_placeholder: "Tìm file/folder theo tên...",
  search_clear: "Xóa tìm",
  btn_add_root_folder: "+ Folder gốc",
  btn_add_root_file: "+ File gốc",
  btn_cut: "✂️ Cắt",
  btn_copy: "📄 Copy",
  btn_paste: "📋 Dán",
  btn_duplicate: "🧬 Nhân bản",
  btn_undo: "↩️ Hoàn tác",
  btn_redo: "↪️ Làm lại",
  btn_collapse_all: "Thu gọn tất cả",
  btn_expand_all: "Mở rộng tất cả",
  btn_import_toggle: "Nhập từ text",
  btn_upload_zip: "Tải ZIP lên",
  btn_export: "Xuất text",
  btn_zip: "Tải ZIP",
  import_placeholder: "Dán cây thư mục dạng text vào đây...",
  btn_import_apply: "Áp dụng",
  btn_import_cancel: "Hủy",
  room_status_offline: "Chưa vào phòng — dữ liệu chỉ lưu cho riêng bạn.",
  room_input_placeholder: "Dán mã phòng để tham gia...",
  btn_join_room: "Tham gia",
  btn_create_room: "Tạo phòng mới",
  btn_share_link: "🔗 Chia sẻ liên kết",

  err_duplicate_name: "Trùng tên, đã đổi thành ",
  empty_tree: "Chưa có gì. Bấm '+ Folder gốc' hoặc '+ File gốc' để bắt đầu.",
  title_add_folder: "Thêm folder con",
  title_add_file: "Thêm file con",
  title_add_gitkeep: "Thêm .gitkeep",
  title_note_gitkeep: "Ghi chú trong .gitkeep",
  title_delete: "Xóa",
  placeholder_note: "Ghi chú nội dung trong .gitkeep (ví dụ: mục đích của folder này)...",
  
  ctx_rename: "Đổi tên",
  ctx_delete: "Xóa",
  ctx_copy: "Copy",
  ctx_cut: "Cắt",
  ctx_duplicate: "Nhân bản",
  ctx_paste: "Dán vào đây",
  ctx_new_folder: "Folder mới",
  ctx_new_file: "File mới",
  
  undo_empty: "Không còn gì để hoàn tác",
  undo_done: "Đã hoàn tác",
  redo_empty: "Không còn gì để làm lại",
  redo_done: "Đã làm lại",
  
  sel_empty: "Chưa chọn mục nào",
  cut_done: "Đã cắt",
  clipboard_empty: "Clipboard trống",
  paste_done: "Đã dán",
  delete_done: "Đã xóa",
  copy_done: "Đã copy",
  duplicate_done: "Đã nhân bản",
  
  search_not_found: "Không tìm thấy",
  
  save_done: "Đã lưu",
  save_err: "Lỗi lưu dữ liệu",
  
  room_peer_connected: "Có người vừa kết nối P2P",
  room_host_status: "Phòng (host):",
  room_host_lost: "Mất kết nối P2P với host.",
  room_host_lost_confirm: "Host của phòng đã ngắt kết nối.\\n\\nBạn có muốn trở thành host mới cho phòng này không?\\n(Cây thư mục hiện tại trên máy bạn sẽ là bản chính thức từ giờ. Những người khác trong phòng cần bấm 'Tham gia' lại với cùng mã phòng để kết nối vào bạn.)",
  room_host_new_waiting: "Phòng (host mới): {roomId} — đang chờ người tham gia...",
  room_host_waiting: "Phòng (host): {roomId} — đang chờ người tham gia...",
  room_left: "Đã rời phòng '{roomId}'. Bạn có thể bấm 'Tham gia' để thử kết nối lại.",
  room_connected_to: "Đã kết nối P2P tới phòng:",
  room_conn_failed: "Kết nối P2P thất bại, thử mạng khác",
  room_connecting: "Đang kết nối tới phòng {roomId}...",
  room_need_id: "Nhập mã phòng trước",
  
  zip_no_lib: "Không tải được thư viện ZIP",
  zip_empty: "(trống)",
  zip_replace_confirm: "Thao tác này sẽ thay thế toàn bộ cây hiện tại. Tiếp tục?",
  zip_reading: "Đang đọc file ZIP...",
  zip_imported: "Đã nhập cấu trúc từ ZIP",
  zip_err: "Lỗi đọc file ZIP",
  
  import_empty: "Chưa dán nội dung nào",
  
  link_copied: "Đã copy liên kết phòng",
  link_copy_failed: "Copy tự động thất bại, đã điền vào ô bên trên",
  
  switch_lang: "🇺🇸 English",

  footer_about: "<strong>BuildFolderTogether</strong> là công cụ tạo cấu trúc thư mục trực tuyến cho lập trình viên. Thiết kế kiến trúc dự án, chia sẻ theo thời gian thực, và xuất ra file ZIP hoặc cây ASCII."
};
