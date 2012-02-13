#!/usr/bin/env python
#coding: utf8

import urllib2
from gzip import GzipFile
from StringIO import StringIO
class ContentEncodingProcessor(urllib2.BaseHandler):
	userAgents = {'firefox':"Mozilla/5.0 (Windows; U; Windows NT 6.1; en-US; rv:1.9.1.6) Gecko/20091201 Firefox/3.5.6",
					'iphone':'Mozilla/5.0 (iPhone; U; CPU like Mac OS X; en) AppleWebKit/420+ (KHTML, like Gecko) Version/3.0 Mobile/1A543a Safari/419.3'
				}
	
	def __init__(self,userAgent='firefox'):
		self.userAgent = self.userAgents.get(userAgent,self.userAgents['firefox'])
	
	def http_request(self, req):
		req.add_header("Accept-Encoding", "gzip, deflate")
		req.add_header("User-Agent", self.userAgent)
		return req
 
	# decode
	def http_response(self, req, resp):
		old_resp = resp
		# gzip
		if resp.headers.get("content-encoding") == "gzip":
			gz = GzipFile(
                    fileobj=StringIO(resp.read()),
                    mode="r"
                  )
			resp = urllib2.addinfourl(gz, old_resp.headers, old_resp.url, old_resp.code)
			resp.msg = old_resp.msg
		# deflate
		if resp.headers.get("content-encoding") == "deflate":
			gz = StringIO( deflate(resp.read()) )
			resp = urllib2.addinfourl(gz, old_resp.headers, old_resp.url, old_resp.code)  # 'class to add info() and
			resp.msg = old_resp.msg
		return resp
 
# deflate support
import zlib
def deflate(data):   # zlib only provides the zlib compress format, not the deflate format;
	try:               # so on top of all there's this workaround:
		return zlib.decompress(data, -zlib.MAX_WBITS)
	except zlib.error:
		return zlib.decompress(data)

encoding_support = ContentEncodingProcessor('iphone')
opener = urllib2.build_opener( encoding_support, urllib2.HTTPHandler)
#content = opener.open(url).read()
#print opener
