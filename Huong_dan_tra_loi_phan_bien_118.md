# CẨM NANG HƯỚNG DẪN TRẢ LỜI PHẢN BIỆN KHÓA LUẬN TỐT NGHIỆP
## ĐỀ TÀI: HỆ THỐNG BÁO CÁO CÔNG KHAI VẤN ĐỀ DÂN SINH ĐÔ THỊ THÔNG MINH - BÁOCÁOVN (MÃ ĐỀ TÀI: 118)

---

## PHẦN I: CÂU HỎI TỔNG QUAN ĐỀ TÀI

### 1. Vì sao nhóm chọn đề tài này?
*   **Trực quan:** Các vấn đề như rác thải, ngập lụt, ổ gà, đèn đường hỏng hiện nay vẫn còn giải quyết chậm do quy trình phản ánh truyền thống cồng kềnh. Người dân khó theo dõi tiến độ, chính quyền khó quản lý tập trung.
*   **Giải pháp:** Nhóm muốn xây dựng một cầu nối số trực quan, áp dụng công nghệ hiện đại (AI, Map, Chatbot) giúp việc tương tác giữa người dân và chính quyền trở nên minh bạch, nhanh chóng và hiệu quả hơn.

### 2. Vấn đề thực tế nào của đô thị mà hệ thống muốn giải quyết?
*   **Sự chậm trễ:** Rút ngắn thời gian từ lúc người dân phát hiện vấn đề đến khi cán bộ chuyên trách tiếp nhận.
*   **Tính minh bạch:** Xóa bỏ tình trạng "phản ánh bị lãng quên" nhờ quy trình công khai trạng thái xử lý cho toàn dân giám sát.
*   **Tối ưu hóa nguồn lực:** Giúp chính quyền lọc tin giả, phân loại đúng lĩnh vực tự động bằng AI, tránh lãng phí nhân lực đi xác minh thủ công.

### 3. Điểm mới nổi bật của đề tài so với các hệ thống phản ánh hiện có (như 1022)?
*   **Kiểm duyệt thông minh bằng AI:** Tích hợp AI (Gemini/Google Vision) phân tích mức độ chân thực của ảnh chụp hiện trường ngay khi gửi để chặn ảnh giả, ảnh tải trên mạng.
*   **Chatbot AI thế hệ mới:** Chatbot NLP (không phải rule-based) hỗ trợ tư vấn luật, quy trình hành chính và hướng dẫn người dân nộp phản ánh tức thì.
*   **Phân phối thông minh:** Cơ chế phân quyền theo lĩnh vực (`managementScope`) tự động lọc và đẩy báo cáo đến đúng cán bộ chuyên môn.
*   **Tương tác cộng đồng:** Người dân có thể "Vote" để biểu quyết độ khẩn cấp và bình luận trực tiếp trên báo cáo để cung cấp thêm bằng chứng.

### 4. Tại sao cần tích hợp AI vào hệ thống thay vì xử lý thủ công?
*   **Giảm tải hành chính:** Hàng ngàn báo cáo gửi lên mỗi ngày nếu dùng người đọc, phân loại sẽ cực kỳ tốn thời gian và dễ nhầm lẫn. AI chỉ mất dưới 2 giây để phân loại danh mục, đánh giá độ khẩn cấp.
*   **Chặn tin rác từ đầu phễu:** AI lọc hình ảnh không phù hợp, nội dung thô tục, phân tích độ tin cậy để ngăn chặn các cuộc phá hoại hệ thống (spam) tự động.

### 5. Đối tượng sử dụng chính của hệ thống là ai?
*   **Người dân:** Người phát hiện sự cố, gửi phản ánh, theo dõi tiến độ, tương tác đánh giá kết quả xử lý.
*   **Cán bộ chuyên trách (Cán bộ chuyên môn):** Tiếp nhận, cập nhật tiến trình và xử lý các vấn đề thuộc phạm vi mình quản lý.
*   **Quản trị viên (Admin):** Cân bằng quyền, quản lý hệ thống danh mục, giám sát hoạt động của các cán bộ và kết xuất thống kê báo cáo.

### 6. Hệ thống này phù hợp triển khai cho quy mô nào: phường, quận hay toàn thành phố?
*   **Kiến trúc linh hoạt:** Hệ thống được thiết kế theo dạng **hội tụ dữ liệu tập trung**, phù hợp nhất cho quy mô **Toàn thành phố** hoặc **Quận/Huyện**.
*   **Phân quyền địa giới hành chính:** Nhờ cấu trúc phân tách rõ ràng theo địa giới (`ward`, `district`, `city`) và lĩnh vực (`category`), hệ thống dễ dàng mở rộng từ một phường lên toàn thành phố mà không cần thay đổi kiến trúc cốt lõi.

### 7. Ý nghĩa thực tiễn lớn nhất của đề tài là gì?
*   Xây dựng lòng tin số giữa người dân và chính quyền thông qua sự công khai, minh bạch quá trình xử lý đô thị. Giúp biến mỗi người dân thành một "cảm biến đô thị" giúp xây dựng thành phố văn minh hơn.

---

## PHẦN II: CÂU HỎI VỀ NGHIỆP VỤ HỆ THỐNG

### 8. Quy trình tiếp nhận và xử lý báo cáo dân sinh hoạt động như thế nào?
1.  **Gửi báo cáo:** Người dân gửi ảnh chụp, mô tả, chọn danh mục và tọa độ (GPS/Bản đồ).
2.  **AI Kiểm duyệt:** AI phân tích ảnh và nội dung, chấm điểm độ tin cậy (`aiConfidence`).
3.  **Tiếp nhận:** Báo cáo ở trạng thái `Chờ tiếp nhận (Pending)`. Cán bộ chuyên môn kiểm tra, bấm `Tiếp nhận` hoặc `Từ chối` (ghi rõ lý do).
4.  **Xử lý:** Cán bộ cập nhật trạng thái sang `Đang xử lý` $\rightarrow$ Tiến hành sửa chữa thực tế $\rightarrow$ Hoàn thành và tải lên hình ảnh minh chứng.
5.  **Giám sát:** Người dân kiểm tra kết quả, chấm điểm đánh giá (rating) mức độ hài lòng.

### 9. Người dân có thể gửi những loại báo cáo nào?
*   Hệ thống hỗ trợ 6 nhóm lĩnh vực chính đô thị thường gặp:
    *   `road`: Sự cố giao thông, ổ gà, sụt lún, rào chắn hỏng.
    *   `garbage`: Rác thải bừa bãi, bãi rác tự phát, cống rãnh tắc.
    *   `lighting`: Đèn đường hỏng, mất điện chiếu sáng công cộng.
    *   `flood`: Ngập úng cục bộ sau mưa, triều cường.
    *   `noise`: Tiếng ồn karaoke, thi công đêm muộn quá giờ quy định.
    *   `other`: Các sự cố đô thị khác.

### 10. Hệ thống xử lý các báo cáo trùng lặp ra sao?
*   **Về không gian và thời gian:** Hệ thống sử dụng thuật toán tính khoảng cách địa lý (Haversine Formula) giữa tọa độ báo cáo mới và các báo cáo hiện có trong cùng danh mục.
*   **Gợi ý trùng lặp:** Nếu tọa độ cách nhau dưới 50m và gửi cách nhau dưới 48 giờ, hệ thống sẽ cảnh báo người dân báo cáo này có thể đã được người khác gửi và gợi ý họ bấm "Vote" (đồng thuận) thay vì tạo mới.

### 11. Nếu người dân gửi thông tin sai hoặc spam thì hệ thống xử lý thế nào?
*   **Chặn từ đầu:** AI kiểm tra nội dung bậy bạ, ảnh không hợp lệ để từ chối ngay lập tức.
*   **Báo cáo từ cộng đồng (Spam Flag):** Người dân khác có thể bấm "Báo cáo sai phạm" (Spam Report). Báo cáo bị flag nhiều sẽ tự động bị ẩn tạm thời để quản trị viên duyệt.
*   **Chặn tài khoản:** Tài khoản cố tình gửi tin giả nhiều lần sẽ bị khóa tự động theo cơ chế `lockAccount`.

### 12. Quy trình duyệt báo cáo tự động bằng AI hoạt động ra sao?
*   Khi người dùng tải ảnh và nhập mô tả, hệ thống gọi API của mô hình Generative AI để:
    *   Xác thực xem ảnh có phải chụp hiện trường thực tế không.
    *   Trích xuất vật thể để xem có khớp với danh mục được chọn không.
    *   Nếu điểm độ tin cậy của AI đạt trên 85% (`aiConfidence >= 85`), hệ thống gắn nhãn `AI Verified` để cán bộ tự tin tiếp nhận nhanh.

### 13. Sau khi AI phân loại, cán bộ quản lý còn cần kiểm duyệt thủ công không?
*   **Bắt buộc cần:** AI chỉ đóng vai trò **hỗ trợ ra quyết định** (phân loại, chấm điểm tin cậy). Quyết định cuối cùng để cử đội sửa chữa thực tế hoặc từ chối phản ánh vẫn nằm trong tay cán bộ chuyên trách để đảm bảo tính pháp lý và chính xác tuyệt đối.

### 14. Hệ thống ưu tiên xử lý các vấn đề khẩn cấp như thế nào?
*   AI phân tích hình ảnh và văn bản để gắn nhãn mức độ nghiêm trọng (`severity`: `low`, `medium`, `high`, `critical`).
*   Bảng điều khiển của cán bộ sẽ tự động sắp xếp các vấn đề có nhãn `critical` (Khẩn cấp) hoặc có số lượt biểu quyết ("Votes") cao nhất lên hàng đầu để ưu tiên giải quyết trước.

### 15. Hệ thống có hỗ trợ theo dõi tiến độ xử lý phản ánh không?
*   **Realtime Timeline:** Mỗi báo cáo đều có một dòng lịch sử xử lý (`processingHistory`) trực quan ghi nhận chi tiết: Ai tiếp nhận lúc nào, cán bộ nào đang phụ trách, ghi chú tiến độ là gì, và ảnh chụp minh chứng sau khi hoàn thành. Người dân có thể theo dõi trực tiếp 24/7.

---

## PHẦN III: CÂU HỎI VỀ AI DUYỆT & PHÂN LOẠI BÁO CÁO

### 16. AI được dùng trong hệ thống để giải quyết những chức năng nào?
1.  **Kiểm duyệt hình ảnh & Văn bản đầu vào:** Phát hiện ảnh giả mạo, ảnh nhạy cảm và lọc từ ngữ tục tĩu.
2.  **Phân loại danh mục tự động:** Gợi ý danh mục báo cáo chính xác dựa trên hình ảnh hiện trường.
3.  **Đánh giá mức độ nghiêm trọng:** Phân tích độ khẩn cấp của vấn đề.
4.  **Hỗ trợ hội thoại (Chatbot):** Giải đáp thắc mắc dịch vụ công cho công dân.

### 17. AI phân loại báo cáo dựa trên tiêu chí gì?
*   **Hình ảnh:** AI nhận diện các vật thể đặc trưng (rác thải, hố sụt, ngập nước, bóng đèn hỏng).
*   **Văn bản mô tả:** Trích xuất từ khóa ngữ nghĩa bằng NLP để phân loại vào 6 danh mục chuẩn.

### 18. Nhóm sử dụng mô hình AI nào? Vì sao chọn mô hình đó?
*   Nhóm tích hợp mô hình **Gemini 1.5 Flash / Gemini 2.0 (qua Google Generative AI SDK)**.
*   **Lý do chọn:**
    *   Hỗ trợ xử lý đa phương thức (Multimodal: đọc hiểu cả ảnh lẫn văn bản cùng lúc) vô cùng mạnh mẽ.
    *   Hỗ trợ tiếng Việt tự nhiên xuất sắc.
    *   Tốc độ phản hồi cực nhanh (dưới 2 giây) và chi phí API tối ưu hơn so với GPT-4.

### 19. Dữ liệu huấn luyện AI được lấy từ đâu? Nhóm tự huấn luyện hay dùng API có sẵn?
*   **Giải pháp:** Nhóm sử dụng **API của mô hình nền tảng lớn (Foundation Model)** kết hợp kỹ thuật **Prompt Engineering (System Instructions / Few-shot Prompting)**.
*   **Lý do:** Việc tự huấn luyện mô hình thị giác máy tính từ đầu đòi hỏi tài nguyên GPU khổng lồ và tập dữ liệu hàng triệu ảnh. Sử dụng mô hình nền tảng lớn giúp hệ thống thừa hưởng trí tuệ nhân tạo toàn cầu, hiểu tiếng Việt cực tốt và nhận diện vật thể chính xác ngay lập tức mà không cần tốn chi phí huấn luyện lại.

### 20. AI xử lý ngôn ngữ tiếng Việt như thế nào? Có nhận diện được nội dung không phù hợp không?
*   **Xử lý ngữ nghĩa:** Mô hình Gemini được Google huấn luyện trên tập dữ liệu tiếng Việt khổng lồ nên hiểu rất rõ ngữ cảnh, tiếng lóng, từ địa phương.
*   **Kiểm duyệt từ tục tĩu:** Nhóm kết hợp **Bộ lọc từ tục địa phương (Local Profanity Filter)** chạy bằng regex ở backend để đảm bảo tốc độ tối đa, kết hợp với AI để phân tích ngữ cảnh xúc phạm ngầm ẩn.

### 21. Nếu AI phân loại sai thì hệ thống xử lý thế nào?
*   **Cơ chế dự phòng:** Hệ thống cho phép cán bộ chuyên môn **chỉnh sửa danh mục thủ công** trực tiếp trên Dashboard. Nếu AI phân loại nhầm rác thải thành ngập lụt, cán bộ chỉ cần chọn lại danh mục đúng, hệ thống sẽ tự động cập nhật và chuyển báo cáo về đúng hòm thư của cán bộ phụ trách lĩnh vực đó.

---

## PHẦN IV: CÂU HỎI VỀ SÀNG LỌC ĐÁNH GIÁ

### 22. “Sàng lọc đánh giá” trong đề tài nghĩa là gì?
*   Là quá trình xác thực mức độ trung thực của các lượt **Đánh giá (Verification)** mà người dân gửi lên sau khi một báo cáo được công bố là đã giải quyết xong. Giúp tránh tình trạng "cán bộ báo cáo khống đã xử lý" hoặc "người dân cố tình đánh giá 1 sao phá hoại".

### 23. Hệ thống xác định đánh giá giả mạo hoặc spam bằng cách nào?
*   **Xác thực bằng hình ảnh hiện trường:** Người dân khi đánh giá bắt buộc hoặc được khuyến khích tải ảnh thực tế nơi đã sửa chữa. AI sẽ quét ảnh này để xác thực xem có đúng hiện trường sạch sẽ/đã sửa không.
*   **Giới hạn tài khoản:** Mỗi tài khoản chỉ được đánh giá 1 lần duy nhất trên 1 báo cáo (`used: true`).
*   **Phân tích khoảng cách (GPS Validation):** Tọa độ của người gửi đánh giá phải nằm trong bán kính gần (ví dụ <100m) so với điểm xảy ra sự cố.

---

## PHẦN V: CÂU HỎI VỀ CHATBOT AI

### 24. Chatbot AI hỗ trợ người dân những chức năng gì?
*   Hướng dẫn quy trình gửi phản ánh đô thị.
*   Giải đáp thắc mắc về quy định pháp luật dân sinh (ví dụ: Tiếng ồn hát karaoke sau 22h bị phạt bao nhiêu?).
*   Tra cứu nhanh trạng thái các báo cáo của công dân thông qua mã báo cáo (`issueCode`).

### 25. Chatbot hoạt động theo keyword hay AI NLP?
*   Hoạt động hoàn toàn bằng **AI NLP (Natural Language Processing)** thế hệ mới. Chatbot có khả năng hiểu toàn bộ câu hỏi dài, hiểu được mục đích thực sự của người dùng kể cả khi họ viết sai chính tả, không dùng từ khóa chuẩn.

### 26. Chatbot có thể trả lời ngoài phạm vi dữ liệu không?
*   Nhóm đã thiết lập cấu hình hướng dẫn hệ thống **(System Prompt/Guardrails)** bắt buộc Chatbot chỉ tập trung trả lời các vấn đề an ninh đô thị, thủ tục hành chính công và chức năng của BáoCáoVN. Nếu hỏi ngoài lề (lập trình, toán học, giải trí), Chatbot sẽ lịch sự từ chối trả lời để giữ đúng vai trò hỗ trợ đô thị.

---

## PHẦN VI: CÂU HỎI VỀ CÔNG NGHỆ VÀ BẢO MẬT

### 27. Nhóm sử dụng ngôn ngữ và framework nào để phát triển? Vì sao?
*   **Backend:** Node.js với Express và TypeScript. Đảm bảo tốc độ xử lý nhanh, lập trình chặt chẽ nhờ kiểu dữ liệu tĩnh (Type-safe).
*   **Frontend:** React, Next.js / Vite với TypeScript, TailwindCSS cho giao diện hiện đại, đáp ứng tốt Responsive (máy tính, điện thoại, máy tính bảng).
*   **Database:** MongoDB Atlas (NoSQL) giúp dễ dàng lưu trữ các tài liệu báo cáo có cấu trúc động (ảnh, video, lịch sử timeline phức tạp) và tối ưu hóa việc truy vấn bản đồ địa lý.

### 28. Hệ thống có hỗ trợ realtime không?
*   Có hỗ trợ đồng bộ dữ liệu nhanh. Các thông báo trạng thái thay đổi hoặc khi có báo cáo mới được cập nhật liên tục qua cơ chế Fetching/Polling hoặc WebSockets đảm bảo trải nghiệm tức thời cho cả cán bộ lẫn người dân.

### 29. Hệ thống bảo vệ thông tin người dân như thế nào? Có xác thực không?
*   **Xác thực bảo mật:** Sử dụng **JWT (JSON Web Token)** kết hợp cơ chế lưu Access Token/Refresh Token an toàn trong cookie bảo mật.
*   **Báo cáo ẩn danh:** Cho phép người dân chọn chế độ "Báo cáo ẩn danh". Khi bật, tên và avatar của họ sẽ hoàn toàn ẩn đi đối với công chúng, chỉ có Admin hệ thống mới có thể truy vết khi cần thiết để tránh tình trạng bị trù dập.
*   **Mã hóa mật khẩu:** Mật khẩu người dùng được băm (hash) bằng thuật toán mã hóa mạnh **Bcrypt** trước khi lưu vào database.

---

## PHẦN VII: CÂU HỎI PHẢN BIỆN CHUYÊN SÂU (KHÓ & ĐẮT GIÁ)

### 30. Nếu bỏ AI ra thì hệ thống còn hoạt động được không?
*   **Trả lời:** **Có, hệ thống vẫn hoạt động hoàn toàn bình thường.** 
*   **Giải thích:** Nhóm thiết kế hệ thống theo nguyên lý **Dự phòng và Tách biệt (Graceful Degradation)**. Nếu tắt AI hoặc API AI bị lỗi, hệ thống sẽ tự động kích hoạt bộ lọc nội bộ (Local Filter) bằng regex để lọc từ tục tĩu, chuyển báo cáo sang trạng thái `Chờ duyệt` để cán bộ tự phân loại thủ công. AI là **công cụ tăng tốc và tối ưu hóa hiệu năng**, không phải là điểm nghẽn gây chết hệ thống (Single Point of Failure).

### 31. AI trong đề tài là “thực sự thông minh” hay chỉ gọi API?
*   **Trả lời:** Đây là ứng dụng AI thực tế có chiều sâu chứ không chỉ gọi API đơn thuần.
*   **Giải thích:** Nhóm không chỉ gửi một câu hỏi lên API rồi nhận kết quả. Nhóm đã xây dựng một **quy trình nghiệp vụ khép kín sử dụng AI (AI Orchestration)**:
    1.  Frontend nén và tối ưu ảnh trước khi gửi.
    2.  Backend thực hiện tiền xử lý dữ liệu.
    3.  Thiết kế kỹ thuật **Structured Prompting** bắt buộc AI trả về kết quả định dạng JSON chuẩn gồm các trường cụ thể (`isAuthentic`, `confidenceScore`, `reasons`, `severity`).
    4.  Nhận diện kết quả JSON từ AI để tự động cập nhật luồng xử lý của hệ thống (Ví dụ: tự phân loại danh mục, tự kích hoạt trạng thái ưu tiên nếu độ nghiêm trọng là `critical`).

### 32. Tại sao đề tài này được xem là ứng dụng AI chứ không chỉ là website CRUD?
*   **Giải thích:** Các website CRUD thông thường chỉ nhận dữ liệu từ người dùng, lưu vào DB và hiển thị ra. Hệ thống của nhóm có sự **tham gia chủ động của trí tuệ nhân tạo vào quy trình nghiệp vụ (Business Logic)**:
    *   Tự động phân tích ảnh hiện trường để chấm điểm tin cậy (chặn ảnh mạng).
    *   Tự động phân tích ngữ nghĩa để đưa ra đề xuất danh mục và mức độ nghiêm trọng mà không cần sự can thiệp của con người ở bước đầu phễu.
    *   Chatbot AI tự động hội thoại ngôn ngữ tự nhiên để hỗ trợ tra cứu và tư vấn pháp luật.
    *   Hệ thống có khả năng tự động thích ứng dựa trên phân tích dữ liệu đa phương thức.

### 33. Đóng góp kỹ thuật lớn nhất của nhóm là gì?
*   **Trả lời:**
    1.  **Thiết kế kiến trúc tích hợp đa phương thức (Multimodal Integration):** Kết hợp thành công dữ liệu không gian (Bản đồ số), dữ liệu hình ảnh (AI Vision), dữ liệu văn bản (NLP) vào trong một luồng nghiệp vụ quản lý đô thị đồng nhất.
    2.  **Tối ưu hóa quy trình nghiệp vụ đô thị:** Xây dựng thành công cơ chế phân quyền xử lý thông minh (`managementScope`) giúp tự động hóa khâu phân phối công việc đến đúng cán bộ chuyên trách, nâng cao hiệu năng làm việc lên gấp nhiều lần so với quy trình cũ.

---
*Chúc nhóm có một buổi bảo vệ khóa luận thành công rực rỡ!*
