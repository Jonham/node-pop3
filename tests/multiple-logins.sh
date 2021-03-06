#!/bin/sh
#	Test script
#
#	Copyright (C) 2011 by Ditesh Shashikant Gathani <ditesh@gathani.org>
#
#	Permission is hereby granted, free of charge, to any person obtaining a copy
#	of this software and associated documentation files (the "Software"), to deal
#	in the Software without restriction, including without limitation the rights
#	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
#	copies of the Software, and to permit persons to whom the Software is
#	furnished to do so, subject to the following conditions:
#
#	The above copyright notice and this permission notice shall be included in
#	all copies or substantial portions of the Software.
#
#	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
#	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
#	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
#	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
#	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
#	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
#	THE SOFTWARE.

print_test_title "multiple-login.js"
print_test "Killing node"
kill_node
OUTPUT="";
if [ $? -gt 0 ]; then
	OUTPUT="fail";
fi
print_result 0 "$OUTPUT"

print_test "Restoring temporary mboxes"
OUTPUT=`cp -R mboxes/* tmp/mboxes`
print_result 0 "$OUTPUT"

print_test "Starting POP3 server"
start_pop3d config/login.json
if [ $? -eq 1 ]; then OUTPUT="fail"; fi
print_result 0 "$OUTPUT"

print_test "Connect and QUIT 100x"
for i in `seq 1 100`; do
    OUTPUT=`node login.js --username $USER --password $PASS --port $PORT --quit --networkdebug on --debug on`;
    echo $OUTPUT | grep -q "fail"
	if [ $? -eq 0 ]; then break; fi
done
print_result 0 "$OUTPUT"

print_test "Valid USER/PASS with existing mbox file 100x"
for i in `seq 1 100`; do
    OUTPUT=`node login.js --username $USER --password $PASS --port $PORT --networkdebug on --debug on`;
    echo $OUTPUT | grep -q "fail"
	if [ $? -eq 0 ]; then break; fi
done
print_result 0 "$OUTPUT"

print_test "Removing mbox file"
OUTPUT=`rm -f tmp/mboxes/$USER`
print_result 0 "$OUTPUT"

print_test "Valid USER/PASS with nonexistent mbox file 100x"
for i in `seq 1 100`; do
    OUTPUT=`node login.js --username $USER --password $PASS --port $PORT --networkdebug on --debug on`;
    echo $OUTPUT | grep -q "fail"
	if [ $? -eq 0 ]; then break; fi
done
print_result 0 "$OUTPUT"

print_test "Invalid USER/PASS 100x"
for i in `seq 1 100`; do
    OUTPUT=`node login.js --username $USER --password ${PASS}a --port $PORT --networkdebug on --debug on`;
    echo $OUTPUT | grep -q "fail"
	if [ $? -eq 0 ]; then break; fi
done
print_result 1 "$OUTPUT"
