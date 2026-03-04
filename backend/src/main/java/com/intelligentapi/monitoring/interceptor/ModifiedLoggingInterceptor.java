// @Component
// // created as a separate file later must be implemented with ApiLoggingInterceptor
// // Connects Controller and Rule Engine to log API requests and analyze them for malicious patterns
// public class ApiLoggingInterceptor implements HandlerInterceptor {

//     @Override
//     public boolean preHandle(HttpServletRequest request,
//                              HttpServletResponse response,
//                              Object handler) {

//         String endpoint = request.getRequestURI();
//         String method = request.getMethod();
//         String ip = request.getRemoteAddr();

//         System.out.println("Request: " + method + " " + endpoint + " from " + ip);

//         return true;
//     }
// }