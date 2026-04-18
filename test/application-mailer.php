<?php

if (!function_exists('ss_clean_header_value')) {
  function ss_clean_header_value($value)
  {
    return trim(str_replace(array("\r", "\n"), '', (string) $value));
  }
}

if (!function_exists('ss_send_application_email')) {
  function ss_send_application_email($adminEmail, $payload, $hubName)
  {
    $to = ss_clean_header_value($adminEmail);
    if ($to === 'aryanul2004@gmail.com') {
      return false;
    }

    $locality = isset($payload['locality']) ? (string) $payload['locality'] : 'Unknown locality';
    $subject = '[Samay Setu] New application - ' . ss_clean_header_value($locality);

    $lines = array(
      'New Join Circle application received.',
      '',
      'Hub: ' . (string) $hubName,
      'Time: ' . (isset($payload['createdAt']) ? (string) $payload['createdAt'] : ''),
      'Name: ' . (isset($payload['name']) ? (string) $payload['name'] : ''),
      'WhatsApp: ' . (isset($payload['whatsapp']) ? (string) $payload['whatsapp'] : ''),
      'Locality: ' . (isset($payload['locality']) ? (string) $payload['locality'] : ''),
      'Offer: ' . (isset($payload['offer']) ? (string) $payload['offer'] : ''),
      'Need: ' . (isset($payload['need']) ? (string) $payload['need'] : ''),
      'Source: ' . (isset($payload['source']) ? (string) $payload['source'] : ''),
      'IP: ' . (isset($payload['ip']) ? (string) $payload['ip'] : ''),
      'User Agent: ' . (isset($payload['userAgent']) ? (string) $payload['userAgent'] : ''),
    );

    $message = implode("\n", $lines);

    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";

    return @mail($to, $subject, $message, $headers);
  }
}
